package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.BudgetResponse;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.service.PriceService;
import com.oliwier.listmebackend.identity.CurrentDevice;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
public class BudgetController {

    private final PriceService priceService;

    @GetMapping("/{listId}/budget")
    public BudgetResponse getBudget(@PathVariable UUID listId,
                                    @CurrentDevice Device device) {
        return priceService.getBudget(listId);
    }
}
