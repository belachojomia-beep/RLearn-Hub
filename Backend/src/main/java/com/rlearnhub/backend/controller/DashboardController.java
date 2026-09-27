package com.rlearnhub.backend.controller;

import com.rlearnhub.backend.entity.Resource;
import com.rlearnhub.backend.repository.DownloadRepository;
import com.rlearnhub.backend.repository.ResourceRepository;
import com.rlearnhub.backend.repository.SubjectRepository;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:5173")
public class DashboardController {

    private final ResourceRepository resourceRepository;
    private final SubjectRepository subjectRepository;
    private final DownloadRepository downloadRepository;

    public DashboardController(
            ResourceRepository resourceRepository,
            SubjectRepository subjectRepository,
            DownloadRepository downloadRepository
    ) {
        this.resourceRepository = resourceRepository;
        this.subjectRepository = subjectRepository;
        this.downloadRepository = downloadRepository;
    }

    // =========================================================
    // DASHBOARD STATISTICS
    // =========================================================

    @GetMapping("/stats")
    public Map<String, Object> getDashboardStats(
            @RequestParam String email
    ) {

        Map<String, Object> stats =
                new HashMap<>();

        long resourceCount =
                resourceRepository.count();

        long subjectCount =
                subjectRepository.count();

        long downloadCount =
                downloadRepository.countByUserEmail(email);

        stats.put(
                "resources",
                resourceCount
        );

        stats.put(
                "downloads",
                downloadCount
        );

        stats.put(
                "subjects",
                subjectCount
        );

        return stats;
    }

    // =========================================================
    // RECENT RESOURCES
    // =========================================================

    @GetMapping("/recent-resources")
    public List<Resource> getRecentResources() {

        return resourceRepository
                .findTop4ByOrderByIdDesc();
    }
}