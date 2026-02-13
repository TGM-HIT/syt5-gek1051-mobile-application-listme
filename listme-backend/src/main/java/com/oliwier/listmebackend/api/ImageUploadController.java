package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.PresignResponse;
import com.oliwier.listmebackend.domain.service.S3StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageUploadController {

    private final S3StorageService storageService;

    @PostMapping("/presign")
    public PresignResponse presign(@RequestParam String filename) {
        return storageService.presign(filename);
    }
}
