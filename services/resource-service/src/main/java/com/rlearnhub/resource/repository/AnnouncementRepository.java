package com.rlearnhub.resource.repository;

import com.rlearnhub.resource.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
}