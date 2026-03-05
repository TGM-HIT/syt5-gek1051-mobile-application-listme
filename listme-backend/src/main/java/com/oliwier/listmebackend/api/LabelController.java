package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.CreateLabelRequest;
import com.oliwier.listmebackend.api.dto.LabelResponse;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.service.LabelService;
import com.oliwier.listmebackend.identity.CurrentDevice;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists/{listId}/labels")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LabelController {

    private final LabelService labelService;

    @GetMapping
    public List<LabelResponse> getLabels(@PathVariable UUID listId, @CurrentDevice Device device) {
        return labelService.getByList(listId, device).stream().map(LabelResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public LabelResponse create(@PathVariable UUID listId,
                                @CurrentDevice Device device,
                                @Valid @RequestBody CreateLabelRequest req) {
        return LabelResponse.from(labelService.create(listId, device, req));
    }

    @PutMapping("/{labelId}")
    @Transactional
    public LabelResponse update(@PathVariable UUID listId,
                                @PathVariable UUID labelId,
                                @CurrentDevice Device device,
                                @Valid @RequestBody CreateLabelRequest req) {
        return LabelResponse.from(labelService.update(listId, labelId, device, req));
    }

    @DeleteMapping("/{labelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID listId,
                       @PathVariable UUID labelId,
                       @CurrentDevice Device device) {
        labelService.delete(listId, labelId, device);
    }
}
