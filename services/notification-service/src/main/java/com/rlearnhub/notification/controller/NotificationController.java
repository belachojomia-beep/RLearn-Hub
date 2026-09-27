package com.rlearnhub.notification.controller;

import com.rlearnhub.notification.entity.Notification;
import com.rlearnhub.notification.repository.NotificationRepository;

import org.springframework.http.ResponseEntity;
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

    // =========================================================
    // GET ALL NOTIFICATIONS FOR A USER
    // =========================================================

    @GetMapping
    public List<Notification> getNotifications(
            @RequestParam String email
    ) {
        return notificationRepository
                .findByUserEmailOrderByIdDesc(email);
    }

    // =========================================================
    // GET UNREAD NOTIFICATION COUNT
    // =========================================================

    @GetMapping("/unread-count")
    public long getUnreadCount(
            @RequestParam String email
    ) {
        return notificationRepository
                .findByUserEmailAndReadStatus(email, false)
                .size();
    }

    // =========================================================
    // CREATE NOTIFICATION
    // =========================================================

    @PostMapping
    public ResponseEntity<Notification> createNotification(
            @RequestBody Notification notification
    ) {
        return ResponseEntity.ok(
                notificationRepository.save(notification)
        );
    }

    // =========================================================
    // MARK NOTIFICATION AS READ
    // =========================================================

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable Long id
    ) {
        return notificationRepository.findById(id)
                .map(notification -> {

                    notification.setReadStatus(true);

                    return ResponseEntity.ok(
                            notificationRepository.save(notification)
                    );

                })
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================================================
    // DELETE NOTIFICATION
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id
    ) {

        if (!notificationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        notificationRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}