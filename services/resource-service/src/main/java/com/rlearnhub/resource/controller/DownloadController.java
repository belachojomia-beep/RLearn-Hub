package com.rlearnhub.resource.controller;

import com.rlearnhub.resource.entity.Download;
import com.rlearnhub.resource.repository.DownloadRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/downloads")
@CrossOrigin(origins = "http://localhost:5173")
public class DownloadController {

    private final DownloadRepository downloadRepository;

    public DownloadController(DownloadRepository downloadRepository) {
        this.downloadRepository = downloadRepository;
    }

    @GetMapping
    public List<Download> getAllDownloads() {
        return downloadRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Download> recordDownload(
            @RequestBody Download download
    ) {
        return ResponseEntity.ok(
                downloadRepository.save(download)
        );
    }
}