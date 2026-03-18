package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.api.dto.CreateCategoryRequest;
import com.oliwier.listmebackend.domain.model.Category;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.repository.CategoryRepository;
import com.oliwier.listmebackend.domain.repository.ListDeviceRepository;
import com.oliwier.listmebackend.domain.repository.ShoppingListRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock CategoryRepository categoryRepository;
    @Mock ShoppingListRepository listRepository;
    @Mock ListDeviceRepository listDeviceRepository;

    @InjectMocks CategoryService categoryService;

    UUID listId = UUID.randomUUID();
    UUID catId  = UUID.randomUUID();
    UUID devId  = UUID.randomUUID();

    ShoppingList list;
    Device device;
    Category category;

    @BeforeEach
    void setUp() {
        device = new Device(devId);
        list   = new ShoppingList(); list.setId(listId);
        category = new Category();   category.setId(catId); category.setList(list);
        category.setName("Dairy");   category.setColor("#fff");
    }

    private void grantAccess() {
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, devId)).thenReturn(true);
    }

    // ── access guard ──────────────────────────────────────────────────────

    @Test
    void getByList_throwsForbidden_whenNotParticipant() {
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(listDeviceRepository.existsByListIdAndDeviceId(listId, devId)).thenReturn(false);
        assertThatThrownBy(() -> categoryService.getByList(listId, device))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    // ── create ────────────────────────────────────────────────────────────

    @Test
    void create_assignsPositionAndSaves() {
        grantAccess();
        when(categoryRepository.findByListIdOrderByPosition(listId)).thenReturn(List.of(category));
        when(categoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var req = new CreateCategoryRequest("Beverages", "#blue");
        Category result = categoryService.create(listId, device, req);

        assertThat(result.getName()).isEqualTo("Beverages");
        assertThat(result.getPosition()).isEqualTo(1); // one existing → position = 1
        assertThat(result.getList()).isSameAs(list);
    }

    // ── update ────────────────────────────────────────────────────────────

    @Test
    void update_changesNameAndColor() {
        grantAccess();
        when(categoryRepository.findById(catId)).thenReturn(Optional.of(category));
        when(categoryRepository.save(any())).thenReturn(category);

        var req = new CreateCategoryRequest("Renamed", "#red");
        Category result = categoryService.update(listId, catId, device, req);

        assertThat(result.getName()).isEqualTo("Renamed");
        assertThat(result.getColor()).isEqualTo("#red");
    }

    @Test
    void update_throws404_whenCategoryBelongsToDifferentList() {
        grantAccess();
        ShoppingList other = new ShoppingList(); other.setId(UUID.randomUUID());
        category.setList(other);
        when(categoryRepository.findById(catId)).thenReturn(Optional.of(category));

        assertThatThrownBy(() -> categoryService.update(listId, catId, device, new CreateCategoryRequest("x", "#x")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    // ── delete ────────────────────────────────────────────────────────────

    @Test
    void delete_removesCategory() {
        grantAccess();
        when(categoryRepository.findById(catId)).thenReturn(Optional.of(category));

        categoryService.delete(listId, catId, device);

        verify(categoryRepository).delete(category);
    }
}
