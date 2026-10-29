
package com.rlearnhub.backend.controller;

import com.rlearnhub.backend.entity.Announcement;
import com.rlearnhub.backend.entity.User;
import com.rlearnhub.backend.messaging.AnnouncementNotificationEvent;
import com.rlearnhub.backend.messaging.AnnouncementNotificationPublisher;
import com.rlearnhub.backend.repository.AnnouncementRepository;
import com.rlearnhub.backend.repository.UserRepository;

import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = "http://localhost:5173")
public class AnnouncementController {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final AnnouncementNotificationPublisher notificationPublisher;

    public AnnouncementController(
            AnnouncementRepository announcementRepository,
            UserRepository userRepository,
            AnnouncementNotificationPublisher notificationPublisher
    ) {
        this.announcementRepository = announcementRepository;
        this.userRepository = userRepository;
        this.notificationPublisher = notificationPublisher;
    }

    // =========================================================
    // GET ALL ANNOUNCEMENTS
    // =========================================================

    @GetMapping
    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAllByOrderByIdDesc();
    }

    // =========================================================
    // GET ANNOUNCEMENT BY ID
    // =========================================================

    @GetMapping("/{id}")
    public Announcement getAnnouncementById(@PathVariable Long id) {
        return announcementRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Announcement not found")
                );
    }

    // =========================================================
    // CREATE ANNOUNCEMENT AND PUBLISH RABBITMQ EVENT
    //
    // ADMIN   -> TEACHERS + STUDENTS
    // TEACHER -> ADMINS + STUDENTS
    // STUDENT -> NOT ALLOWED
    // =========================================================

    @PostMapping
    public Announcement createAnnouncement(
            @RequestBody Announcement announcement
    ) {

        // Validate author name
        String authorName = announcement.getAuthor();

        if (authorName == null || authorName.trim().isEmpty()) {
            throw new RuntimeException(
                    "Announcement author is required."
            );
        }

        // Find the author
        User author = userRepository.findAll()
                .stream()
                .filter(user ->
                        user.getName() != null
                                && user.getName().equalsIgnoreCase(
                                        authorName.trim()
                                )
                )
                .findFirst()
                .orElse(null);

        if (author == null) {
            throw new RuntimeException(
                    "Announcement author was not found."
            );
        }

        // Validate author role
        String authorRole = author.getRole();

        if (authorRole == null) {
            throw new RuntimeException(
                    "Announcement author's role was not found."
            );
        }

        authorRole = authorRole.trim().toUpperCase();

        if ("STUDENT".equals(authorRole)) {
            throw new RuntimeException(
                    "Students are not allowed to create announcements."
            );
        }

        if (!"ADMIN".equals(authorRole)
                && !"TEACHER".equals(authorRole)) {
            throw new RuntimeException(
                    "Only administrators and teachers can create announcements."
            );
        }

        // Save the announcement first
        Announcement savedAnnouncement =
                announcementRepository.save(announcement);

        // Determine eligible recipients
        List<User> recipients = new ArrayList<>();

        if ("ADMIN".equals(authorRole)) {
            recipients.addAll(
                    userRepository.findByRoleIgnoreCase("TEACHER")
            );
            recipients.addAll(
                    userRepository.findByRoleIgnoreCase("STUDENT")
            );
        } else if ("TEACHER".equals(authorRole)) {
            recipients.addAll(
                    userRepository.findByRoleIgnoreCase("ADMIN")
            );
            recipients.addAll(
                    userRepository.findByRoleIgnoreCase("STUDENT")
            );
        }

        // Collect valid, unique recipient emails
        List<String> recipientEmails = recipients.stream()
                .map(User::getEmail)
                .filter(email ->
                        email != null && !email.isBlank()
                )
                .map(String::trim)
                .distinct()
                .toList();

        // Publish one event for the Notification Service
        if (!recipientEmails.isEmpty()) {

            AnnouncementNotificationEvent event =
                    new AnnouncementNotificationEvent();

            event.setRecipientEmails(recipientEmails);
            event.setTitle("New Announcement");
            event.setMessage(
                    savedAnnouncement.getTitle()
                            + ": "
                            + savedAnnouncement.getMessage()
            );
            event.setType("ANNOUNCEMENT");
            event.setDateCreated(
                    savedAnnouncement.getDatePosted()
            );

            notificationPublisher.publish(event);
        }

        return savedAnnouncement;
    }

    // =========================================================
    // UPDATE ANNOUNCEMENT
    // =========================================================

    @PutMapping("/{id}")
    public Announcement updateAnnouncement(
            @PathVariable Long id,
            @RequestBody Announcement updatedAnnouncement
    ) {

        Announcement announcement =
                announcementRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Announcement not found"
                                )
                        );

        announcement.setTitle(updatedAnnouncement.getTitle());
        announcement.setMessage(updatedAnnouncement.getMessage());
        announcement.setAuthor(updatedAnnouncement.getAuthor());
        announcement.setDatePosted(updatedAnnouncement.getDatePosted());

        return announcementRepository.save(announcement);
    }

    // =========================================================
    // DELETE ANNOUNCEMENT
    // =========================================================

    @DeleteMapping("/{id}")
    public void deleteAnnouncement(@PathVariable Long id) {
        announcementRepository.deleteById(id);
    }
}
