package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.ItemHistoryResponse;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.repository.ItemRepository;
import com.oliwier.listmebackend.identity.CurrentDevice;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemHistoryController {

    private final ItemRepository itemRepository;

    @GetMapping("/history")
    public List<ItemHistoryResponse> getHistory(
            @CurrentDevice Device device,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "8") int limit) {

        int cap = Math.min(limit, 20);
        List<Object[]> rows = itemRepository.findHistoryRaw(
                device.getId().toString(), q.trim(), cap);

        return rows.stream().map(r -> new ItemHistoryResponse(
                (String) r[0],
                (String) r[1],
                r[2] != null ? new BigDecimal(r[2].toString()) : null,
                (String) r[3]
        )).toList();
    }
}
