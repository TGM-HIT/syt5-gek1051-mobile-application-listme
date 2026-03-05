package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.service.ExportService;
import com.oliwier.listmebackend.identity.CurrentDevice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/{listId}/export")
    public ResponseEntity<byte[]> export(
            @PathVariable UUID listId,
            @RequestParam(defaultValue = "csv") String format,
            @CurrentDevice Device device) {

        if ("pdf".equalsIgnoreCase(format)) {
            byte[] pdf = exportService.exportPdf(listId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"liste.pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        }

        byte[] csv = exportService.exportCsv(listId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"liste.csv\"")
                .contentType(new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8))
                .body(csv);
    }
}
