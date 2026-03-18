package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.api.dto.BudgetResponse;
import com.oliwier.listmebackend.domain.model.Category;
import com.oliwier.listmebackend.domain.model.Item;
import com.oliwier.listmebackend.domain.repository.ItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PriceServiceTest {

    @Mock ItemRepository itemRepository;

    @InjectMocks PriceService priceService;

    UUID listId = UUID.randomUUID();

    private Item item(String name, boolean checked, BigDecimal price, String catName) {
        Item i = new Item();
        i.setId(UUID.randomUUID());
        i.setName(name);
        i.setChecked(checked);
        i.setPrice(price);
        if (catName != null) {
            Category cat = new Category();
            cat.setName(catName);
            i.setCategory(cat);
        }
        return i;
    }

    @Test
    void getBudget_returnsZero_whenNoItems() {
        when(itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(listId))
                .thenReturn(List.of());
        BudgetResponse result = priceService.getBudget(listId);
        assertThat(result.total()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.byCategory()).isEmpty();
    }

    @Test
    void getBudget_excludesCheckedItems() {
        Item unchecked = item("Milk", false, new BigDecimal("1.50"), null);
        Item checked = item("Bread", true, new BigDecimal("2.00"), null);
        when(itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(listId))
                .thenReturn(List.of(unchecked, checked));
        BudgetResponse result = priceService.getBudget(listId);
        assertThat(result.total()).isEqualByComparingTo(new BigDecimal("1.50"));
    }

    @Test
    void getBudget_excludesItemsWithNullPrice() {
        Item withPrice = item("Milk", false, new BigDecimal("2.00"), null);
        Item noPrice   = item("Eggs", false, null, null);
        when(itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(listId))
                .thenReturn(List.of(withPrice, noPrice));
        BudgetResponse result = priceService.getBudget(listId);
        assertThat(result.total()).isEqualByComparingTo(new BigDecimal("2.00"));
    }

    @Test
    void getBudget_sumsPricesCorrectly() {
        Item a = item("Milk", false, new BigDecimal("1.00"), null);
        Item b = item("Eggs", false, new BigDecimal("2.50"), null);
        Item c = item("Bread", false, new BigDecimal("1.50"), null);
        when(itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(listId))
                .thenReturn(List.of(a, b, c));
        BudgetResponse result = priceService.getBudget(listId);
        assertThat(result.total()).isEqualByComparingTo(new BigDecimal("5.00"));
    }

    @Test
    void getBudget_groupsByCategory() {
        Item dairy1 = item("Milk",   false, new BigDecimal("1.00"), "Dairy");
        Item dairy2 = item("Cheese", false, new BigDecimal("3.00"), "Dairy");
        Item veg    = item("Carrot", false, new BigDecimal("0.80"), "Vegetables");
        when(itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(listId))
                .thenReturn(List.of(dairy1, dairy2, veg));
        BudgetResponse result = priceService.getBudget(listId);
        assertThat(result.total()).isEqualByComparingTo(new BigDecimal("4.80"));
        assertThat(result.byCategory()).containsKey("Dairy");
        assertThat(result.byCategory().get("Dairy")).isEqualByComparingTo(new BigDecimal("4.00"));
        assertThat(result.byCategory().get("Vegetables")).isEqualByComparingTo(new BigDecimal("0.80"));
    }

    @Test
    void getBudget_usesItemNameAsCategoryKey_whenNoCategory() {
        Item item = item("Milk", false, new BigDecimal("1.20"), null);
        when(itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(listId))
                .thenReturn(List.of(item));
        BudgetResponse result = priceService.getBudget(listId);
        assertThat(result.byCategory()).containsKey("Milk");
    }
}
