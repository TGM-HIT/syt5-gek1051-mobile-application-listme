package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.api.dto.CreateLabelRequest;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.Label;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.repository.LabelRepository;
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
public class LabelService {

    private final LabelRepository labelRepository;
    private final ShoppingListRepository listRepository;
    private final ListDeviceRepository listDeviceRepository;

    public List<Label> getByList(UUID listId, Device device) {
        requireAccess(listId, device);
        return labelRepository.findByListId(listId);
    }

    @Transactional
    public Label create(UUID listId, Device device, CreateLabelRequest req) {
        ShoppingList list = requireAccess(listId, device);

        Label label = new Label();
        label.setList(list);
        label.setName(req.name());
        label.setColor(req.color());

        return labelRepository.save(label);
    }

    @Transactional
    public Label update(UUID listId, UUID labelId, Device device, CreateLabelRequest req) {
        requireAccess(listId, device);
        Label label = requireLabel(labelId, listId);

        label.setName(req.name());
        label.setColor(req.color());

        return labelRepository.save(label);
    }

    @Transactional
    public void delete(UUID listId, UUID labelId, Device device) {
        requireAccess(listId, device);
        Label label = requireLabel(labelId, listId);
        labelRepository.delete(label);
    }

    private ShoppingList requireAccess(UUID listId, Device device) {
        ShoppingList list = listRepository.findById(listId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "List not found"));
        if (!listDeviceRepository.existsByListIdAndDeviceId(listId, device.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant of this list");
        }
        return list;
    }

    private Label requireLabel(UUID labelId, UUID listId) {
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Label not found"));
        if (!label.getList().getId().equals(listId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Label not found in this list");
        }
        return label;
    }
}
