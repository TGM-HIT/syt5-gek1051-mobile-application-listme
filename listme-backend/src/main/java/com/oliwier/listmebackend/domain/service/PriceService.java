package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.api.dto.BudgetResponse;
import com.oliwier.listmebackend.domain.model.Item;
import com.oliwier.listmebackend.domain.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PriceService {

    private final ItemRepository itemRepository;

    public BudgetResponse getBudget(UUID listId) {
        List<Item> unchecked = itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(listId)
                .stream()
                .filter(i -> !i.isChecked() && i.getPrice() != null)
                .toList();

        BigDecimal total = BigDecimal.ZERO;
        Map<String, BigDecimal> byCategory = new LinkedHashMap<>();

        for (Item item : unchecked) {
            BigDecimal lineTotal = item.getPrice();
            total = total.add(lineTotal);

            String cat = item.getCategory() != null ? item.getCategory().getName() : item.getName();
            byCategory.merge(cat, lineTotal, BigDecimal::add);
        }

        return new BudgetResponse(total, byCategory);
    }
}
