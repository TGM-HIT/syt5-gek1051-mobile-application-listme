package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.CategoryResponse;
import com.oliwier.listmebackend.api.dto.CreateCategoryRequest;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.service.CategoryService;
import com.oliwier.listmebackend.identity.CurrentDevice;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists/{listId}/categories")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public List<CategoryResponse> getCategories(@PathVariable UUID listId, @CurrentDevice Device device) {
        return categoryService.getByList(listId, device).stream().map(CategoryResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public CategoryResponse create(@PathVariable UUID listId,
                                   @CurrentDevice Device device,
                                   @Valid @RequestBody CreateCategoryRequest req) {
        return CategoryResponse.from(categoryService.create(listId, device, req));
    }

    @PutMapping("/{categoryId}")
    @Transactional
    public CategoryResponse update(@PathVariable UUID listId,
                                   @PathVariable UUID categoryId,
                                   @CurrentDevice Device device,
                                   @Valid @RequestBody CreateCategoryRequest req) {
        return CategoryResponse.from(categoryService.update(listId, categoryId, device, req));
    }

    @DeleteMapping("/{categoryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID listId,
                       @PathVariable UUID categoryId,
                       @CurrentDevice Device device) {
        categoryService.delete(listId, categoryId, device);
    }
}
