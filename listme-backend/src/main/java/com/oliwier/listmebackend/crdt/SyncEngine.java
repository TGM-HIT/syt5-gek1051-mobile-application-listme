package com.oliwier.listmebackend.crdt;

import com.oliwier.listmebackend.domain.model.*;
import com.oliwier.listmebackend.domain.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core CRDT sync service.
 *
 * Responsibilities:
 *  - Record every mutation as a CrdtOperation with a vector clock snapshot
 *  - Maintain the per-(list,device) vector clock counter in the DB
 *  - Provide access to a list's full operation log
 *  - Apply incoming operations from remote devices (idempotent)
 */
@Service
@RequiredArgsConstructor
public class SyncEngine {

    public record SyncResult(List<CrdtOperation> applied, List<ConflictDetector.Conflict> conflicts) {}

    private final CrdtOperationRepository operationRepository;
    private final VectorClockEntryRepository clockRepository;
    private final ShoppingListRepository listRepository;
    private final ItemRepository itemRepository;

    // ── Record a local mutation ────────────────────────────────────────────

    /**
     * Called by services (ItemService, etc.) after every mutation.
     * Increments this device's clock for the list and persists the operation.
     */
    @Transactional
    public CrdtOperation record(ShoppingList list, Device device,
                                OperationType type, Map<String, Object> payload) {
        // 1. Load current clock for this (list, device)
        VectorClockEntryId vcId = new VectorClockEntryId(list.getId(), device.getId());
        VectorClockEntry entry = clockRepository.findById(vcId).orElseGet(() -> {
            VectorClockEntry e = new VectorClockEntry();
            e.setId(vcId);
            e.setList(list);
            e.setDevice(device);
            e.setCounter(0L);
            return e;
        });

        // 2. Increment own counter
        entry.setCounter(entry.getCounter() + 1);
        clockRepository.save(entry);

        // 3. Build current vector clock snapshot (all devices for this list)
        VectorClock currentClock = buildClock(list.getId())
                .increment(device.getId().toString()); // reflect incremented value

        // 4. Persist the operation
        CrdtOperation op = new CrdtOperation();
        op.setList(list);
        op.setDevice(device);
        op.setOperationType(type.name());
        op.setPayload(payload);
        op.setVectorClock(currentClock.toMap());
        return operationRepository.save(op);
    }

    // ── Pull: ops the client hasn't seen yet ──────────────────────────────

    /**
     * Returns all operations for a list that are newer than the given client clock.
     * An op is "new" to the client if the op's device counter exceeds what the
     * client has already seen from that device.
     */
    @Transactional(readOnly = true)
    public List<CrdtOperation> getOperationsSince(UUID listId, Map<String, Long> clientClock) {
        VectorClock since = VectorClock.of(clientClock);
        return operationRepository.findByListIdOrderByCreatedAtAsc(listId)
                .stream()
                .filter(op -> {
                    String deviceId = op.getDevice().getId().toString();
                    long opCounter = VectorClock.of(op.getVectorClock()).get(deviceId);
                    long clientKnows = since.get(deviceId);
                    return opCounter > clientKnows;
                })
                .toList();
    }

    // ── Push: apply incoming ops from a remote device ────────────────────

    /**
     * Idempotently applies a set of incoming CRDT operations from a client.
     * Operations already known to the server (by ID) are skipped.
     * For each new op, the actual Item/List state is updated via LWW.
     * Returns the list of operations that were newly applied (not duplicates).
     */
    @Transactional
    public SyncResult applyIncoming(List<IncomingOperation> incoming, Device device) {
        List<CrdtOperation> applied = new ArrayList<>();
        Set<UUID> affectedLists = new HashSet<>();

        for (IncomingOperation inOp : incoming) {
            // Idempotency: skip if already stored
            if (operationRepository.existsById(inOp.id())) continue;

            ShoppingList list = listRepository.findById(inOp.listId()).orElse(null);
            if (list == null) continue;

            // Persist the operation record as-is (with its original vector clock)
            CrdtOperation op = new CrdtOperation();
            op.setId(inOp.id());
            op.setList(list);
            op.setDevice(device);
            op.setOperationType(inOp.operationType());
            op.setPayload(inOp.payload());
            op.setVectorClock(inOp.vectorClock());
            operationRepository.save(op);

            // Apply effect to current state using LWW
            applyEffect(inOp, list, device);

            // Merge incoming clock into server's clock for this device+list
            mergeIncomingClock(list, device, VectorClock.of(inOp.vectorClock()));

            applied.add(op);
            affectedLists.add(inOp.listId());
        }

        // Detect conflicts across all affected lists
        List<ConflictDetector.Conflict> conflicts = affectedLists.stream()
                .flatMap(listId -> ConflictDetector.detect(
                        operationRepository.findByListIdOrderByCreatedAtAsc(listId)).stream())
                .collect(Collectors.toList());

        return new SyncResult(applied, conflicts);
    }

    // ── Current vector clock for a list ──────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Long> getCurrentClock(UUID listId) {
        return buildClock(listId).toMap();
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private VectorClock buildClock(UUID listId) {
        VectorClock vc = new VectorClock();
        for (VectorClockEntry entry : clockRepository.findByListId(listId)) {
            String deviceId = entry.getId().getDeviceId().toString();
            // Manually build from counter entries
            vc = VectorClock.of(vc.toMap());
            Map<String, Long> m = vc.toMap();
            m.put(deviceId, entry.getCounter());
            vc = VectorClock.of(m);
        }
        return vc;
    }

    private void applyEffect(IncomingOperation op, ShoppingList list, Device device) {
        Map<String, Object> payload = op.payload();
        switch (op.operationType()) {
            case "ITEM_CHECK" -> {
                String itemId = (String) payload.get("itemId");
                Boolean checked = (Boolean) payload.get("checked");
                if (itemId == null || checked == null) return;
                itemRepository.findById(UUID.fromString(itemId)).ifPresent(item -> {
                    item.setChecked(checked);
                    itemRepository.save(item);
                });
            }
            case "ITEM_CREATE" -> {
                String itemId = (String) payload.get("itemId");
                String name = (String) payload.get("name");
                if (itemId == null || name == null) return;
                // Idempotent: only create if not already exists
                if (!itemRepository.existsById(UUID.fromString(itemId))) {
                    Item item = new Item();
                    item.setId(UUID.fromString(itemId));
                    item.setList(list);
                    item.setName(name);
                    item.setChecked(false);
                    item.setPosition(itemRepository.countByListIdAndDeletedAtIsNull(list.getId()));
                    item.setCreatedByDevice(device);
                    if (payload.get("quantity") != null)
                        item.setQuantity(new BigDecimal(payload.get("quantity").toString()));
                    if (payload.get("quantityUnit") != null)
                        item.setQuantityUnit((String) payload.get("quantityUnit"));
                    if (payload.get("price") != null)
                        item.setPrice(new BigDecimal(payload.get("price").toString()));
                    if (payload.get("imageUrl") != null)
                        item.setImageUrl((String) payload.get("imageUrl"));
                    itemRepository.save(item);
                }
            }
            case "ITEM_UPDATE" -> {
                String itemId = (String) payload.get("itemId");
                String name = (String) payload.get("name");
                if (itemId == null || name == null) return;
                itemRepository.findById(UUID.fromString(itemId)).ifPresent(item -> {
                    // LWW: only update if incoming timestamp is newer
                    long incomingTs = toLong(payload.get("timestamp"));
                    long localTs = item.getUpdatedAt().toEpochMilli();
                    if (incomingTs >= localTs) {
                        item.setName(name);
                        if (payload.containsKey("quantity"))
                            item.setQuantity(payload.get("quantity") != null
                                ? new BigDecimal(payload.get("quantity").toString()) : null);
                        if (payload.containsKey("quantityUnit"))
                            item.setQuantityUnit((String) payload.get("quantityUnit"));
                        if (payload.containsKey("price"))
                            item.setPrice(payload.get("price") != null
                                ? new BigDecimal(payload.get("price").toString()) : null);
                        if (payload.containsKey("imageUrl"))
                            item.setImageUrl((String) payload.get("imageUrl"));
                        itemRepository.save(item);
                    }
                });
            }
            case "ITEM_DELETE" -> {
                String itemId = (String) payload.get("itemId");
                if (itemId == null) return;
                itemRepository.findById(UUID.fromString(itemId))
                        .ifPresent(itemRepository::delete);
            }
            case "LIST_UPDATE" -> {
                String name = (String) payload.get("name");
                String emoji = (String) payload.get("emoji");
                long incomingTs = toLong(payload.get("timestamp"));
                long localTs = list.getUpdatedAt().toEpochMilli();
                if (incomingTs >= localTs) {
                    if (name != null) list.setName(name);
                    if (emoji != null) list.setEmoji(emoji);
                    listRepository.save(list);
                }
            }
        }
    }

    private void mergeIncomingClock(ShoppingList list, Device device, VectorClock incoming) {
        VectorClockEntryId vcId = new VectorClockEntryId(list.getId(), device.getId());
        VectorClockEntry entry = clockRepository.findById(vcId).orElseGet(() -> {
            VectorClockEntry e = new VectorClockEntry();
            e.setId(vcId);
            e.setList(list);
            e.setDevice(device);
            e.setCounter(0L);
            return e;
        });
        long incomingCounter = incoming.get(device.getId().toString());
        if (incomingCounter > entry.getCounter()) {
            entry.setCounter(incomingCounter);
            clockRepository.save(entry);
        }
    }

    private long toLong(Object value) {
        if (value instanceof Long l) return l;
        if (value instanceof Integer i) return i.longValue();
        if (value instanceof Number n) return n.longValue();
        return 0L;
    }
}
