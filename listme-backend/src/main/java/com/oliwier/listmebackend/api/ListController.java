package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.CreateListRequest;
import com.oliwier.listmebackend.api.dto.ListResponse;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.ListDevice;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.repository.ShoppingListRepository;
import com.oliwier.listmebackend.identity.CurrentDevice;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ListController {

    private final ShoppingListRepository listRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ListResponse create(@CurrentDevice Device device, @Valid @RequestBody CreateListRequest req) {
        ShoppingList list = new ShoppingList();
        list.setId(UUID.randomUUID());
        list.setName(req.name());
        list.setEmoji(req.emoji() != null ? req.emoji() : "\uD83D\uDED2");
        list.setCreatedByDevice(device);

        ListDevice ld = new ListDevice(list, device, "owner");
        list.getListDevices().add(ld);

        list = listRepository.save(list);
        return ListResponse.from(list);
    }

    @GetMapping
    public List<ListResponse> getMyLists(@CurrentDevice Device device) {
        return listRepository.findAllByDeviceId(device.getId())
                .stream()
                .map(ListResponse::from)
                .toList();
    }
}
