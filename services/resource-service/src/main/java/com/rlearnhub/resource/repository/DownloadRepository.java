package com.rlearnhub.resource.repository;

import com.rlearnhub.resource.entity.Download;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DownloadRepository extends JpaRepository<Download, Long> {
}