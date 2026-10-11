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
import java.util.ArrayList;
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
            Paths.get("uploads", "resources");

    private static final long MAX_FILE_SIZE =
            50L * 1024L * 1024L;

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
    // GET ALL APPROVED RESOURCES
    // =========================================================

    @GetMapping
    public List<Resource> getAllResources() {
        return resourceRepository
                .findByStatusIgnoreCaseOrderByIdDesc("APPROVED");
    }

    // =========================================================
    // GET ONE APPROVED RESOURCE
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(
            @PathVariable Long id
    ) {
        return resourceRepository.findById(id)
                .filter(resource ->
                        "APPROVED".equalsIgnoreCase(
                                resource.getStatus()
                        )
                )
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================================================
    // GET RECENT APPROVED RESOURCES
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
    // CREATE RESOURCE RECORD
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
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("subject") String subject,
            @RequestParam("topic") String topic,
            @RequestParam("yearLevel") String yearLevel,
            @RequestParam("author") String author,
            @RequestParam("dateAdded") String dateAdded
    ) throws IOException {

        // Validate the uploaded file.

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("Please select a file to upload.");
        }

        if (title == null || title.isBlank()
                || subject == null || subject.isBlank()
                || topic == null || topic.isBlank()
                || yearLevel == null || yearLevel.isBlank()
                || author == null || author.isBlank()
                || dateAdded == null || dateAdded.isBlank()) {

            return ResponseEntity.badRequest()
                    .body("All resource fields are required.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest()
                    .body("File is too large. Maximum file size is 50 MB.");
        }

        // Extract only the filename, excluding any supplied path.

        String suppliedName = file.getOriginalFilename();

        if (suppliedName == null || suppliedName.isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Invalid file name.");
        }

        String originalFileName = suppliedName
                .replace('\\', '/');

        originalFileName = originalFileName.substring(
                originalFileName.lastIndexOf('/') + 1
        );

        if (originalFileName.isBlank()
                || originalFileName.equals(".")
                || originalFileName.equals("..")) {
            return ResponseEntity.badRequest()
                    .body("Invalid file name.");
        }

        int dotIndex = originalFileName.lastIndexOf('.');

        if (dotIndex <= 0 || dotIndex == originalFileName.length() - 1) {
            return ResponseEntity.badRequest()
                    .body(
                            "File type not supported. Upload PDF, DOC, DOCX, "
                                    + "PPT, PPTX, or a supported video."
                    );
        }

        String extension = originalFileName
                .substring(dotIndex + 1)
                .toLowerCase();

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return ResponseEntity.badRequest()
                    .body(
                            "File type not supported. Allowed files: PDF, "
                                    + "DOC, DOCX, PPT, PPTX, MP4, WEBM, MOV, "
                                    + "AVI, and MKV."
                    );
        }

        // Create the upload directory.

        Files.createDirectories(uploadDirectory);

        // Use a generated filename to avoid collisions and path injection.

        String uniqueFileName =
                UUID.randomUUID() + "_" + originalFileName;

        Path filePath = uploadDirectory
                .resolve(uniqueFileName)
                .toAbsolutePath()
                .normalize();

        Path uploadRoot = uploadDirectory
                .toAbsolutePath()
                .normalize();

        if (!filePath.startsWith(uploadRoot)) {
            return ResponseEntity.badRequest()
                    .body("Invalid upload path.");
        }

        // Save the uploaded file.

        try (var inputStream = file.getInputStream()) {
            Files.copy(inputStream, filePath);
        }

        // Prepare resource metadata.

        String type = extension.toUpperCase();

        double sizeInMB =
                file.getSize() / (1024.0 * 1024.0);

        String size = String.format("%.2f MB", sizeInMB);

        Resource resource = new Resource(
                title.trim(),
                subject.trim(),
                topic.trim(),
                yearLevel.trim(),
                author.trim(),
                dateAdded.trim(),
                type,
                size
        );

        resource.setFileName(originalFileName);

        /*
         * Store a path relative to the resource-service working
         * directory where possible. The resolver below also supports
         * older relative paths stored with Windows backslashes.
         */
        resource.setFilePath(
                uploadDirectory.resolve(uniqueFileName).toString()
        );

        try {
            Resource savedResource =
                    resourceRepository.save(resource);

            return ResponseEntity.ok(savedResource);
        } catch (RuntimeException exception) {
            // Avoid leaving an unreferenced file if the database save fails.
            Files.deleteIfExists(filePath);
            throw exception;
        }
    }

    // =========================================================
    // VIEW APPROVED RESOURCE FILE
    // =========================================================

    @GetMapping("/{id}/file")
    public ResponseEntity<org.springframework.core.io.Resource>
    viewResourceFile(
            @PathVariable Long id
    ) throws IOException {

        Resource resource = findApprovedResource(id);

        return serveResourceFile(resource, true, null);
    }

    // =========================================================
    // DOWNLOAD APPROVED RESOURCE FILE
    // =========================================================

    @GetMapping("/{id}/download")
    public ResponseEntity<org.springframework.core.io.Resource>
    downloadResourceFile(
            @PathVariable Long id,
            @RequestParam String email
    ) throws IOException {

        Resource resource = findApprovedResource(id);

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email is required."
            );
        }

        return serveResourceFile(resource, false, email.trim());
    }

    // =========================================================
    // ADMIN REVIEW: LIST PENDING RESOURCES
    // =========================================================

    @GetMapping("/review")
    public ResponseEntity<List<Resource>> getResourcesForReview() {
        return ResponseEntity.ok(
                resourceRepository.findByStatusIgnoreCase("PENDING")
        );
    }

    // =========================================================
    // ADMIN REVIEW: PREVIEW A RESOURCE FILE
    //
    // The gateway must restrict this endpoint to ADMIN.
    // Pending resources can be previewed without being approved.
    // =========================================================

    @GetMapping("/review/{id}/file")
    public ResponseEntity<org.springframework.core.io.Resource>
    viewResourceForReview(
            @PathVariable Long id
    ) throws IOException {

        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Resource not found."
                        )
                );

        return serveResourceFile(resource, true, null);
    }

    // =========================================================
    // ADMIN REVIEW: DOWNLOAD A RESOURCE FILE
    //
    // The gateway must restrict this endpoint to ADMIN.
    // =========================================================

    @GetMapping("/review/{id}/download")
    public ResponseEntity<org.springframework.core.io.Resource>
    downloadResourceForReview(
            @PathVariable Long id,
            @RequestParam String email
    ) throws IOException {

        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Resource not found."
                        )
                );

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email is required."
            );
        }

        return serveResourceFile(resource, false, email.trim());
    }

    // =========================================================
    // APPROVE RESOURCE
    // =========================================================

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveResource(
            @PathVariable Long id
    ) {
        var optionalResource = resourceRepository.findById(id);

        if (optionalResource.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = optionalResource.get();

        resource.setStatus("APPROVED");

        Resource savedResource =
                resourceRepository.save(resource);

        return ResponseEntity.ok(savedResource);
    }

    // =========================================================
    // REJECT RESOURCE
    // =========================================================

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectResource(
            @PathVariable Long id
    ) {
        var optionalResource = resourceRepository.findById(id);

        if (optionalResource.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = optionalResource.get();

        resource.setStatus("REJECTED");

        Resource savedResource =
                resourceRepository.save(resource);

        return ResponseEntity.ok(savedResource);
    }

    // =========================================================
    // DELETE RESOURCE
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResource(
            @PathVariable Long id
    ) throws IOException {

        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Resource not found."
                        )
                );

        // Resolve only files located inside an upload directory.

        if (resource.getFilePath() != null
                && !resource.getFilePath().isBlank()) {

            Path filePath =
                    resolveResourcePath(resource.getFilePath());

            if (filePath != null) {
                Files.deleteIfExists(filePath);
            }
        }

        resourceRepository.delete(resource);

        return ResponseEntity.ok(
                "Resource deleted successfully."
        );
    }

    // =========================================================
    // FIND APPROVED RESOURCE
    // =========================================================

    private Resource findApprovedResource(Long id) {
        return resourceRepository.findById(id)
                .filter(resource ->
                        "APPROVED".equalsIgnoreCase(
                                resource.getStatus()
                        )
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Approved resource not found."
                        )
                );
    }

    // =========================================================
    // PREPARE A RESOURCE FILE RESPONSE
    // =========================================================

    private ResponseEntity<org.springframework.core.io.Resource>
    serveResourceFile(
            Resource resource,
            boolean inline,
            String downloadEmail
    ) throws IOException {

        Path filePath =
                resolveResourcePath(resource.getFilePath());

        if (filePath == null
                || !Files.exists(filePath)
                || !Files.isRegularFile(filePath)) {

            return ResponseEntity.notFound().build();
        }

        // Track actual download requests, not previews.

        if (!inline && downloadEmail != null) {
            Download download = new Download(
                    resource.getId(),
                    resource.getTitle(),
                    downloadEmail,
                    java.time.LocalDateTime.now().toString()
            );

            downloadRepository.save(download);
        }

        org.springframework.core.io.Resource fileResource =
                new FileSystemResource(filePath);

        String contentType =
                Files.probeContentType(filePath);

        if (contentType == null || contentType.isBlank()) {
            contentType = getContentType(
                    getExtension(resource.getFileName())
            );
        }

        String fileName = safeHeaderFileName(
                resource.getFileName(),
                filePath.getFileName().toString()
        );

        String disposition = inline
                ? "inline; filename=\"" + fileName + "\""
                : "attachment; filename=\"" + fileName + "\"";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .body(fileResource);
    }

    // =========================================================
    // RESOLVE STORED FILE PATHS
    //
    // Supports:
    // uploads\resources\example.pdf
    // uploads/resources/example.pdf
    // Older paths saved from the repository root.
    //
    // Files are restricted to known upload directories.
    // =========================================================

    private Path resolveResourcePath(String storedPath) {

        if (storedPath == null || storedPath.isBlank()) {
            return null;
        }

        try {
            String normalizedStoredPath =
                    storedPath.replace('\\', '/');

            Path stored = Paths.get(normalizedStoredPath).normalize();

            Path workingDirectory =
                    Paths.get("").toAbsolutePath().normalize();

            Path workingUploadRoot = workingDirectory
                    .resolve(Paths.get("uploads", "resources"))
                    .normalize();

            Path projectServiceRoot = workingDirectory
                    .resolve(Paths.get("services", "resource-service"))
                    .normalize();

            Path projectUploadRoot = projectServiceRoot
                    .resolve(Paths.get("uploads", "resources"))
                    .normalize();

            List<Path> allowedRoots = new ArrayList<>();
            allowedRoots.add(workingUploadRoot);
            allowedRoots.add(projectUploadRoot);

            List<Path> candidates = new ArrayList<>();

            if (stored.isAbsolute()) {
                candidates.add(stored.toAbsolutePath().normalize());
            } else {
                candidates.add(
                        workingDirectory.resolve(stored).normalize()
                );

                candidates.add(
                        projectServiceRoot.resolve(stored).normalize()
                );
            }

            for (Path candidate : candidates) {
                for (Path root : allowedRoots) {
                    if (candidate.startsWith(root)
                            && Files.isRegularFile(candidate)) {
                        return candidate;
                    }
                }
            }

            return null;

        } catch (RuntimeException exception) {
            return null;
        }
    }

    // =========================================================
    // EXTRACT FILE EXTENSION SAFELY
    // =========================================================

    private String getExtension(String fileName) {

        if (fileName == null || fileName.isBlank()) {
            return "";
        }

        String normalizedName =
                fileName.replace('\\', '/');

        int slashIndex = normalizedName.lastIndexOf('/');
        normalizedName =
                normalizedName.substring(slashIndex + 1);

        int dotIndex = normalizedName.lastIndexOf('.');

        if (dotIndex < 0 || dotIndex == normalizedName.length() - 1) {
            return "";
        }

        return normalizedName
                .substring(dotIndex + 1)
                .toLowerCase();
    }

    // =========================================================
    // SAFE FILENAME FOR RESPONSE HEADERS
    // =========================================================

    private String safeHeaderFileName(
            String preferredName,
            String fallbackName
    ) {

        String fileName = preferredName;

        if (fileName == null || fileName.isBlank()) {
            fileName = fallbackName;
        }

        if (fileName == null || fileName.isBlank()) {
            fileName = "resource";
        }

        fileName = fileName.replace('\\', '/');

        fileName = fileName.substring(
                fileName.lastIndexOf('/') + 1
        );

        // Prevent header injection and quoted-header breakage.
        fileName = fileName
                .replace("\"", "_")
                .replace("\r", "_")
                .replace("\n", "_");

        return fileName;
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
