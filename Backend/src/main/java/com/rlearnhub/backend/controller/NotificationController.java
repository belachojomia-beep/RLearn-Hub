package com.rlearnhub.backend.controller;

import com.rlearnhub.backend.entity.Notification;
import com.rlearnhub.backend.repository.NotificationRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(
            NotificationRepository notificationRepository
    ) {
        this.notificationRepository = notificationRepository;
    }

    // Get all notifications for a user
    @GetMapping
    public List<Notification> getNotifications(
            @RequestParam String email
    ) {
        return notificationRepository
                .findByUserEmailOrderByIdDesc(email);
    }

    // Get unread notification count
    @GetMapping("/unread-count")
    public long getUnreadCount(
            @RequestParam String email
    ) {
        return notificationRepository
                .findByUserEmailAndReadStatus(email, false)
                .size();
    }

    // Create notification
    @PostMapping
    public Notification createNotification(
            @RequestBody Notification notification
    ) {
        return notificationRepository.save(notification);
    }

    // Mark notification as read
    @PutMapping("/{id}/read")
    public Notification markAsRead(
            @PathVariable Long id
    ) {
        Notification notification =
                notificationRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"
                                )
                        );

        notification.setReadStatus(true);

        return notificationRepository.save(notification);
    }

    // Delete notification
    @DeleteMapping("/{id}")
    public void deleteNotification(
            @PathVariable Long id
    ) {
        notificationRepository.deleteById(id);
    }
}