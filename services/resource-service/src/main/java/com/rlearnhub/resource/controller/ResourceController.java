package com.rlearnhub.resource.controller;

import com.rlearnhub.resource.entity.Download;
import com.rlearnhub.resource.entity.Resource;
import com.rlearnhub.resource.repository.DownloadRepository;
import com.rlearnhub.resource.repository.ResourceRepository;

import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "http://localhost:5173")
public class ResourceController {

    private final ResourceRepository resourceRepository;
    private final DownloadRepository downloadRepository;

    private final Path uploadDirectory =
            Paths.get("uploads/resources");

    private static final Set<String> ALLOWED_EXTENSIONS =
            new HashSet<>(Arrays.asList(
                    "pdf",
                    "doc",
                    "docx",
                    "ppt",
                    "pptx",
                    "mp4",
                    "webm",
                    "mov",
                    "avi",
                    "mkv"
            ));

    public ResourceController(
            ResourceRepository resourceRepository,
            DownloadRepository downloadRepository
    ) {
        this.resourceRepository = resourceRepository;
        this.downloadRepository = downloadRepository;
    }

    // =========================================================
    // GET ALL RESOURCES
    // =========================================================
        @GetMapping
        public List<Resource> getAllResources() {
        return resourceRepository
                .findByStatusIgnoreCaseOrderByIdDesc("APPROVED");
        }

    // =========================================================
    // GET RESOURCE BY ID
    // =========================================================
        @GetMapping("/{id}")
        public ResponseEntity<Resource> getResourceById(@PathVariable Long id) {
        return resourceRepository.findById(id)
            .filter(resource -> "APPROVED".equalsIgnoreCase(resource.getStatus()))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
}
    // =========================================================
    // GET RECENT RESOURCES
    // =========================================================

    @GetMapping("/recent")
        public List<Resource> getRecentResources() {
         return resourceRepository
            .findByStatusIgnoreCaseOrderByIdDesc("APPROVED")
            .stream()
            .limit(4)
            .toList();
                }

    // =========================================================
    // CREATE RESOURCE
    // =========================================================

    @PostMapping
    public ResponseEntity<Resource> createResource(
            @RequestBody Resource resource
    ) {
        return ResponseEntity.ok(
                resourceRepository.save(resource)
        );
    }

    // =========================================================
    // UPLOAD RESOURCE
    // =========================================================

    @PostMapping("/upload")
    public ResponseEntity<?> uploadResource(

            @RequestParam("file")
            MultipartFile file,

            @RequestParam("title")
            String title,

            @RequestParam("subject")
            String subject,

            @RequestParam("topic")
            String topic,

            @RequestParam("yearLevel")
            String yearLevel,

            @RequestParam("author")
            String author,

            @RequestParam("dateAdded")
            String dateAdded

    ) throws IOException {

        // ---------------------------------------------------------
        // CHECK FILE
        // ---------------------------------------------------------

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("Please select a file to upload.");
        }

        // ---------------------------------------------------------
        // CHECK FILE NAME
        // ---------------------------------------------------------

        String originalFileName =
                file.getOriginalFilename();

        if (originalFileName == null ||
                originalFileName.isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Invalid file name.");
        }

        // ---------------------------------------------------------
        // GET FILE EXTENSION
        // ---------------------------------------------------------

        int dotIndex =
                originalFileName.lastIndexOf(".");

        if (dotIndex < 0) {
            return ResponseEntity.badRequest()
                    .body(
                            "File type not supported. " +
                            "Please upload PDF, DOC, DOCX, PPT, PPTX, or video."
                    );
        }

        String extension =
                originalFileName
                        .substring(dotIndex + 1)
                        .toLowerCase();

        // ---------------------------------------------------------
        // CHECK ALLOWED FILE TYPE
        // ---------------------------------------------------------

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return ResponseEntity.badRequest()
                    .body(
                            "File type not supported. " +
                            "Allowed files: PDF, DOC, DOCX, PPT, PPTX, " +
                            "MP4, WEBM, MOV, AVI, and MKV."
                    );
        }

        // ---------------------------------------------------------
        // CHECK FILE SIZE
        // Maximum: 50 MB
        // ---------------------------------------------------------

        long maxFileSize =
                50L * 1024L * 1024L;

        if (file.getSize() > maxFileSize) {
            return ResponseEntity.badRequest()
                    .body(
                            "File is too large. " +
                            "Maximum file size is 50 MB."
                    );
        }

        // ---------------------------------------------------------
        // CREATE UPLOAD DIRECTORY
        // ---------------------------------------------------------

        Files.createDirectories(uploadDirectory);

        // ---------------------------------------------------------
        // CREATE UNIQUE FILE NAME
        // ---------------------------------------------------------

        String uniqueFileName =
                UUID.randomUUID()
                        + "_"
                        + originalFileName;

        // ---------------------------------------------------------
        // CREATE FILE PATH
        // ---------------------------------------------------------

        Path filePath =
                uploadDirectory.resolve(uniqueFileName);

        // ---------------------------------------------------------
        // SAVE FILE
        // ---------------------------------------------------------

        Files.copy(
                file.getInputStream(),
                filePath
        );

        // ---------------------------------------------------------
        // DETERMINE FILE TYPE
        // ---------------------------------------------------------

        String type =
                extension.toUpperCase();

        // ---------------------------------------------------------
        // DETERMINE FILE SIZE
        // ---------------------------------------------------------

        double sizeInMB =
                file.getSize()
                        / (1024.0 * 1024.0);

        String size =
                String.format(
                        "%.2f MB",
                        sizeInMB
                );

        // ---------------------------------------------------------
        // CREATE RESOURCE
        // ---------------------------------------------------------

        Resource resource =
                new Resource(
                        title,
                        subject,
                        topic,
                        yearLevel,
                        author,
                        dateAdded,
                        type,
                        size
                );

        // ---------------------------------------------------------
        // SAVE FILE INFORMATION
        // ---------------------------------------------------------

        resource.setFileName(
                originalFileName
        );

        resource.setFilePath(
                filePath.toString()
        );

        // ---------------------------------------------------------
        // SAVE RESOURCE
        // ---------------------------------------------------------

        Resource savedResource =
                resourceRepository.save(resource);

        return ResponseEntity.ok(savedResource);
    }

    // =========================================================
    // VIEW RESOURCE FILE
    // =========================================================

    @GetMapping("/{id}/file")
    public ResponseEntity<org.springframework.core.io.Resource>
    viewResourceFile(
            @PathVariable Long id
    ) throws IOException {

        Resource resource = resourceRepository.findById(id)
        .filter(r -> "APPROVED".equalsIgnoreCase(r.getStatus()))
        .orElseThrow(() ->
                new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Resource not found"
                )
        );


        if (resource.getFilePath() == null ||
                resource.getFilePath().isBlank()) {

            return ResponseEntity.notFound().build();
        }

        Path filePath =
                Paths.get(resource.getFilePath());

        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        org.springframework.core.io.Resource fileResource =
                new FileSystemResource(filePath);

        String contentType =
                Files.probeContentType(filePath);

        if (contentType == null) {

            String extension =
                    resource.getFileName()
                            .substring(
                                    resource.getFileName()
                                            .lastIndexOf(".") + 1
                            )
                            .toLowerCase();

            contentType =
                    getContentType(extension);
        }

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType(contentType)
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" +
                                resource.getFileName() +
                                "\""
                )
                .body(fileResource);
    }

    // =========================================================
    // DOWNLOAD RESOURCE FILE
    // =========================================================

    @GetMapping("/{id}/download")
    public ResponseEntity<org.springframework.core.io.Resource>
    downloadResourceFile(
            @PathVariable Long id,
            @RequestParam String email
    ) throws IOException {

        Resource resource = resourceRepository.findById(id)
        .filter(r -> "APPROVED".equalsIgnoreCase(r.getStatus()))
        .orElseThrow(() ->
                new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Resource not found"
                )
        );
        // ---------------------------------------------------------
        // CHECK FILE PATH
        // ---------------------------------------------------------

        if (resource.getFilePath() == null ||
                resource.getFilePath().isBlank()) {

            return ResponseEntity.notFound().build();
        }

        Path filePath =
                Paths.get(resource.getFilePath());

        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        // ---------------------------------------------------------
        // CREATE DOWNLOAD RECORD
        // ---------------------------------------------------------

        Download download =
                new Download(
                        resource.getId(),
                        resource.getTitle(),
                        email,
                        java.time.LocalDateTime.now().toString()
                );

        downloadRepository.save(download);

        // ---------------------------------------------------------
        // PREPARE FILE
        // ---------------------------------------------------------

        org.springframework.core.io.Resource fileResource =
                new FileSystemResource(filePath);

        String contentType =
                Files.probeContentType(filePath);

        if (contentType == null) {

            String extension =
                    resource.getFileName()
                            .substring(
                                    resource.getFileName()
                                            .lastIndexOf(".") + 1
                            )
                            .toLowerCase();

            contentType =
                    getContentType(extension);
        }

        // ---------------------------------------------------------
        // RETURN FILE
        // ---------------------------------------------------------

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType(contentType)
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" +
                                resource.getFileName() +
                                "\""
                )
                .body(fileResource);
    }
        // =========================================================
// ADMIN REVIEW RESOURCES
// =========================================================

@GetMapping("/review")
public ResponseEntity<List<Resource>> getResourcesForReview() {

    return ResponseEntity.ok(
            resourceRepository.findByStatusIgnoreCase("PENDING")
    );
}

// =========================================================
// APPROVE RESOURCE
// =========================================================

@PutMapping("/{id}/approve")
public ResponseEntity<?> approveResource(
        @PathVariable Long id
) {

    return resourceRepository.findById(id)
            .map(resource -> {

                resource.setStatus("APPROVED");

                Resource savedResource =
                        resourceRepository.save(resource);

                return ResponseEntity.ok(savedResource);
            })
            .orElse(ResponseEntity.notFound().build());
}

// =========================================================
// REJECT RESOURCE
// =========================================================

@PutMapping("/{id}/reject")
public ResponseEntity<?> rejectResource(
        @PathVariable Long id
) {

    return resourceRepository.findById(id)
            .map(resource -> {

                resource.setStatus("REJECTED");

                Resource savedResource =
                        resourceRepository.save(resource);

                return ResponseEntity.ok(savedResource);
            })
            .orElse(ResponseEntity.notFound().build());
}

// =========================================================
// DELETE RESOURCE
// =========================================================

@DeleteMapping("/{id}")
public ResponseEntity<?> deleteResource(
        @PathVariable Long id
) throws IOException {

    Resource resource =
            resourceRepository.findById(id)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Resource not found"
                            )
                    );

    // ---------------------------------------------------------
    // DELETE PHYSICAL FILE
    // ---------------------------------------------------------

    if (resource.getFilePath() != null &&
            !resource.getFilePath().isBlank()) {

        Path filePath =
                Paths.get(resource.getFilePath());

        Files.deleteIfExists(filePath);
    }

    // ---------------------------------------------------------
    // DELETE DATABASE RECORD
    // ---------------------------------------------------------

    resourceRepository.deleteById(id);

    return ResponseEntity.ok(
            "Resource deleted successfully."
    );
}

// =========================================================
// CONTENT TYPE HELPER
// =========================================================

private String getContentType(String extension) {

    switch (extension) {

        case "pdf":
            return "application/pdf";

        case "doc":
            return "application/msword";

        case "docx":
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        case "ppt":
            return "application/vnd.ms-powerpoint";

        case "pptx":
            return "application/vnd.openxmlformats-officedocument.presentationml.presentation";

        case "mp4":
            return "video/mp4";

        case "webm":
            return "video/webm";

        case "mov":
            return "video/quicktime";

        case "avi":
            return "video/x-msvideo";

        case "mkv":
            return "video/x-matroska";

        default:
            return "application/octet-stream";
    }
}
}