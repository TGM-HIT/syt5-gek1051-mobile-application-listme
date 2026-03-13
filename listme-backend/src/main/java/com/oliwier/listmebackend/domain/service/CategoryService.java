package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.api.dto.CreateCategoryRequest;
import com.oliwier.listmebackend.domain.model.Category;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.repository.CategoryRepository;
import com.oliwier.listmebackend.domain.repository.ListDeviceRepository;
import com.oliwier.listmebackend.domain.repository.ShoppingListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ShoppingListRepository listRepository;
    private final ListDeviceRepository listDeviceRepository;

    public List<Category> getByList(UUID listId, Device device) {
        requireAccess(listId, device);
        return categoryRepository.findByListIdOrderByPosition(listId);
    }

    @Transactional
    public Category create(UUID listId, Device device, CreateCategoryRequest req) {
        ShoppingList list = requireAccess(listId, device);

        int maxPos = categoryRepository.findByListIdOrderByPosition(listId).size();

        Category category = new Category();
        category.setList(list);
        category.setName(req.name());
        category.setColor(req.color());
        category.setPosition(maxPos);

        return categoryRepository.save(category);
    }

    @Transactional
    public Category update(UUID listId, UUID categoryId, Device device, CreateCategoryRequest req) {
        requireAccess(listId, device);
        Category category = requireCategory(categoryId, listId);

        category.setName(req.name());
        category.setColor(req.color());

        return categoryRepository.save(category);
    }

    @Transactional
    public void delete(UUID listId, UUID categoryId, Device device) {
        requireAccess(listId, device);
        Category category = requireCategory(categoryId, listId);
        categoryRepository.delete(category);
    }

    private ShoppingList requireAccess(UUID listId, Device device) {
        ShoppingList list = listRepository.findById(listId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "List not found"));
        if (!listDeviceRepository.existsByListIdAndDeviceId(listId, device.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant of this list");
        }
        return list;
    }

    private Category requireCategory(UUID categoryId, UUID listId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        if (!category.getList().getId().equals(listId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found in this list");
        }
        return category;
    }
}
