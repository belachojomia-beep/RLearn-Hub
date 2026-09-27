package com.rlearnhub.notification.repository;

import com.rlearnhub.notification.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementRepository
        extends JpaRepository<Announcement, Long> {
}
