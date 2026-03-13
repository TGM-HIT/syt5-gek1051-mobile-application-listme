package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.api.dto.PresignResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.Duration;
import java.util.UUID;

@Service
public class S3StorageService {

    @Value("${aws.region}")
    private String region;

    @Value("${aws.s3.bucket}")
    private String bucket;

    public PresignResponse presign(String originalFilename) {
        String ext = originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                : "";
        String key = "items/" + UUID.randomUUID() + ext;

        try (S3Presigner presigner = S3Presigner.builder()
                .region(Region.of(region))
                .build()) {

            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            PresignedPutObjectRequest presigned = presigner.presignPutObject(r -> r
                    .signatureDuration(Duration.ofMinutes(5))
                    .putObjectRequest(putRequest));

            String publicUrl = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
            return new PresignResponse(presigned.url().toString(), publicUrl);
        }
    }
}
