package com.rlearnhub.backend.controller;

import com.rlearnhub.backend.entity.Download;
import com.rlearnhub.backend.entity.Resource;
import com.rlearnhub.backend.repository.DownloadRepository;
import com.rlearnhub.backend.repository.ResourceRepository;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    private final Path uploadDirectory =
            Paths.get("uploads/resources");

    /*
     * =========================================================
     * ALLOWED FILE EXTENSIONS
     * =========================================================
     */

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

    /*
     * =========================================================
     * CONSTRUCTOR
     * =========================================================
     */

   private final DownloadRepository downloadRepository;

public ResourceController(
        ResourceRepository resourceRepository,
        DownloadRepository downloadRepository
) {
    this.resourceRepository = resourceRepository;
    this.downloadRepository = downloadRepository;
}

    /*
     * =========================================================
     * GET ALL RESOURCES
     * =========================================================
     */

    @GetMapping
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    /*
     * =========================================================
     * GET RESOURCE BY ID
     * =========================================================
     */

    @GetMapping("/{id}")
    public Resource getResourceById(
            @PathVariable Long id
    ) {

        return resourceRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Resource not found")
                );
    }

    /*
     * =========================================================
     * CREATE RESOURCE
     * =========================================================
     */

    @PostMapping
    public Resource createResource(
            @RequestBody Resource resource
    ) {

        return resourceRepository.save(resource);
    }

    /*
     * =========================================================
     * UPLOAD RESOURCE
     * =========================================================
     */

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

        /*
         * -----------------------------------------------------
         * CHECK FILE
         * -----------------------------------------------------
         */

        if (file == null || file.isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Please select a file to upload.");
        }

        /*
         * -----------------------------------------------------
         * CHECK FILE NAME
         * -----------------------------------------------------
         */

        String originalFileName =
                file.getOriginalFilename();

        if (originalFileName == null ||
                originalFileName.isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Invalid file name.");
        }

        /*
         * -----------------------------------------------------
         * GET FILE EXTENSION
         * -----------------------------------------------------
         */

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

        /*
         * -----------------------------------------------------
         * CHECK ALLOWED FILE TYPE
         * -----------------------------------------------------
         */

        if (!ALLOWED_EXTENSIONS.contains(extension)) {

            return ResponseEntity.badRequest()
                    .body(
                            "File type not supported. " +
                            "Allowed files: PDF, DOC, DOCX, PPT, PPTX, " +
                            "MP4, WEBM, MOV, AVI, and MKV."
                    );
        }

        /*
         * -----------------------------------------------------
         * CHECK FILE SIZE
         *
         * 50 MB maximum
         * -----------------------------------------------------
         */

        long maxFileSize =
                50L * 1024L * 1024L;

        if (file.getSize() > maxFileSize) {

            return ResponseEntity.badRequest()
                    .body(
                            "File is too large. " +
                            "Maximum file size is 50 MB."
                    );
        }

        /*
         * -----------------------------------------------------
         * MAKE SURE UPLOAD DIRECTORY EXISTS
         * -----------------------------------------------------
         */

        Files.createDirectories(uploadDirectory);

        /*
         * -----------------------------------------------------
         * CREATE UNIQUE FILE NAME
         * -----------------------------------------------------
         */

        String uniqueFileName =
                UUID.randomUUID()
                        + "_"
                        + originalFileName;

        /*
         * -----------------------------------------------------
         * CREATE FILE PATH
         * -----------------------------------------------------
         */

        Path filePath =
                uploadDirectory.resolve(uniqueFileName);

        /*
         * -----------------------------------------------------
         * SAVE FILE
         * -----------------------------------------------------
         */

        Files.copy(
                file.getInputStream(),
                filePath
        );

        /*
         * -----------------------------------------------------
         * DETERMINE FILE TYPE
         * -----------------------------------------------------
         */

        String type =
                extension.toUpperCase();

        /*
         * -----------------------------------------------------
         * DETERMINE FILE SIZE
         * -----------------------------------------------------
         */

        double sizeInMB =
                file.getSize()
                        / (1024.0 * 1024.0);

        String size =
                String.format(
                        "%.2f MB",
                        sizeInMB
                );

        /*
         * -----------------------------------------------------
         * CREATE RESOURCE DATABASE RECORD
         * -----------------------------------------------------
         */

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

        /*
         * -----------------------------------------------------
         * SAVE FILE INFORMATION
         * -----------------------------------------------------
         */

        resource.setFileName(
                originalFileName
        );

        resource.setFilePath(
                filePath.toString()
        );

        /*
         * -----------------------------------------------------
         * SAVE RESOURCE
         * -----------------------------------------------------
         */

        Resource savedResource =
                resourceRepository.save(resource);

        return ResponseEntity.ok(savedResource);
    }

    /*
     * =========================================================
     * VIEW RESOURCE FILE
     * =========================================================
     */

    @GetMapping("/{id}/file")
    public ResponseEntity<org.springframework.core.io.Resource>
    viewResourceFile(
            @PathVariable Long id
    ) throws IOException {

        Resource resource =
                resourceRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
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
                new org.springframework.core.io.FileSystemResource(
                        filePath
                );

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

    /*
     * =========================================================
     * DOWNLOAD RESOURCE FILE
     * =========================================================
     */

    // =========================================================
// DOWNLOAD RESOURCE FILE
// =========================================================

@GetMapping("/{id}/download")
public ResponseEntity<org.springframework.core.io.Resource>
downloadResourceFile(
        @PathVariable Long id,
        @RequestParam String email
) throws IOException {

    Resource resource =
            resourceRepository.findById(id)
                    .orElseThrow(() ->
                            new RuntimeException(
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
                    email,
                    resource.getId(),
                    resource.getTitle(),
                    java.time.LocalDateTime.now()
                            .toString()
            );

    downloadRepository.save(download);

    // ---------------------------------------------------------
    // PREPARE FILE
    // ---------------------------------------------------------

    org.springframework.core.io.Resource fileResource =
            new org.springframework.core.io.FileSystemResource(
                    filePath
            );

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

    /*
     * =========================================================
     * DELETE RESOURCE
     * =========================================================
     */

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResource(
            @PathVariable Long id
    ) throws IOException {

        /*
         * Find resource
         */

        Resource resource =
                resourceRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Resource not found"
                                )
                        );

        /*
         * Delete physical file
         */

        if (resource.getFilePath() != null &&
                !resource.getFilePath().isBlank()) {

            Path filePath =
                    Paths.get(resource.getFilePath());

            Files.deleteIfExists(filePath);
        }

        /*
         * Delete database record
         */

        resourceRepository.deleteById(id);

        return ResponseEntity.ok(
                "Resource deleted successfully."
        );
    }

    /*
     * =========================================================
     * CONTENT TYPE HELPER
     * =========================================================
     */

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