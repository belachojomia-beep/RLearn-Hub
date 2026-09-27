package com.rlearnhub.backend.repository;

import com.rlearnhub.backend.entity.Download;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DownloadRepository
        extends JpaRepository<Download, Long> {

    List<Download> findByUserEmailOrderByIdDesc(
            String userEmail
    );

    long countByUserEmail(
            String userEmail
    );
}