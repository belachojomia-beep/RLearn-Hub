package com.rlearnhub.notification.repository;

import com.rlearnhub.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByUserEmailOrderByIdDesc(
            String userEmail
    );

    List<Notification> findByUserEmailAndReadStatus(
            String userEmail,
            boolean readStatus
    );
}