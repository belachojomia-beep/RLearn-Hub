package com.rlearnhub.backend.repository;

import com.rlearnhub.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByUserEmailOrderByIdDesc(String userEmail);

    List<Notification> findByUserEmailAndReadStatus(
            String userEmail,
            boolean readStatus
    );
}