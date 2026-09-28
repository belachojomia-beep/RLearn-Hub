package com.rlearnhub.backend.controller;

import com.rlearnhub.backend.entity.Announcement;
import com.rlearnhub.backend.entity.Notification;
import com.rlearnhub.backend.entity.User;
import com.rlearnhub.backend.repository.AnnouncementRepository;
import com.rlearnhub.backend.repository.NotificationRepository;
import com.rlearnhub.backend.repository.UserRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = "http://localhost:5173")
public class AnnouncementController {

    private final AnnouncementRepository announcementRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public AnnouncementController(
            AnnouncementRepository announcementRepository,
            NotificationRepository notificationRepository,
            UserRepository userRepository
    ) {
        this.announcementRepository = announcementRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
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
    public Announcement getAnnouncementById(
            @PathVariable Long id
    ) {
        return announcementRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Announcement not found"
                        )
                );
    }

    // =========================================================
    // CREATE ANNOUNCEMENT
    //
    // ADMIN:
    //   -> notify TEACHERS
    //   -> notify STUDENTS
    //
    // TEACHER:
    //   -> notify ADMINS
    //   -> notify STUDENTS
    //
    // STUDENT:
    //   -> NOT ALLOWED to create announcements
    // =========================================================

    @PostMapping
    public Announcement createAnnouncement(
            @RequestBody Announcement announcement
    ) {

        // -----------------------------------------------------
        // Validate announcement author
        // -----------------------------------------------------

        String authorName = announcement.getAuthor();

        if (authorName == null || authorName.trim().isEmpty()) {
            throw new RuntimeException(
                    "Announcement author is required."
            );
        }

        // -----------------------------------------------------
        // Find the user who created the announcement
        // -----------------------------------------------------

        User author = userRepository
                .findAll()
                .stream()
                .filter(user ->
                        user.getName() != null &&
                        user.getName().equalsIgnoreCase(
                                authorName.trim()
                        )
                )
                .findFirst()
                .orElse(null);

        // -----------------------------------------------------
        // Make sure the author exists
        // -----------------------------------------------------

        if (author == null) {
            throw new RuntimeException(
                    "Announcement author was not found."
            );
        }

        // -----------------------------------------------------
        // Get author role
        // -----------------------------------------------------

        String authorRole = author.getRole();

        if (authorRole == null) {
            throw new RuntimeException(
                    "Announcement author's role was not found."
            );
        }

        authorRole = authorRole.trim().toUpperCase();

        // -----------------------------------------------------
        // STUDENTS CANNOT CREATE ANNOUNCEMENTS
        // -----------------------------------------------------

        if ("STUDENT".equals(authorRole)) {
            throw new RuntimeException(
                    "Students are not allowed to create announcements."
            );
        }

        // -----------------------------------------------------
        // Only ADMIN and TEACHER can create announcements
        // -----------------------------------------------------

        if (!"ADMIN".equals(authorRole)
                && !"TEACHER".equals(authorRole)) {

            throw new RuntimeException(
                    "Only administrators and teachers can create announcements."
            );
        }

        // -----------------------------------------------------
        // Save announcement
        // -----------------------------------------------------

        Announcement savedAnnouncement =
                announcementRepository.save(announcement);

        // -----------------------------------------------------
        // Notification message
        // -----------------------------------------------------

        String notificationTitle =
                "New Announcement";

        String notificationMessage =
                savedAnnouncement.getTitle()
                        + ": "
                        + savedAnnouncement.getMessage();

        String notificationDate =
                savedAnnouncement.getDatePosted();

        // =====================================================
        // ADMIN CREATES ANNOUNCEMENT
        // Notify:
        //   1. ALL TEACHERS
        //   2. ALL STUDENTS
        // =====================================================

        if ("ADMIN".equals(authorRole)) {

            List<User> teachers =
                    userRepository.findByRoleIgnoreCase("TEACHER");

            List<User> students =
                    userRepository.findByRoleIgnoreCase("STUDENT");

            // Notify teachers
            for (User teacher : teachers) {

                createNotification(
                        teacher.getEmail(),
                        notificationTitle,
                        notificationMessage,
                        notificationDate
                );
            }

            // Notify students
            for (User student : students) {

                createNotification(
                        student.getEmail(),
                        notificationTitle,
                        notificationMessage,
                        notificationDate
                );
            }
        }

        // =====================================================
        // TEACHER CREATES ANNOUNCEMENT
        // Notify:
        //   1. ALL ADMINS
        //   2. ALL STUDENTS
        // =====================================================

        if ("TEACHER".equals(authorRole)) {

            List<User> admins =
                    userRepository.findByRoleIgnoreCase("ADMIN");

            List<User> students =
                    userRepository.findByRoleIgnoreCase("STUDENT");

            // Notify admins
            for (User admin : admins) {

                createNotification(
                        admin.getEmail(),
                        notificationTitle,
                        notificationMessage,
                        notificationDate
                );
            }

            // Notify students
            for (User student : students) {

                createNotification(
                        student.getEmail(),
                        notificationTitle,
                        notificationMessage,
                        notificationDate
                );
            }
        }

        return savedAnnouncement;
    }

    // =========================================================
    // CREATE NOTIFICATION HELPER
    // =========================================================

    private void createNotification(
            String userEmail,
            String title,
            String message,
            String dateCreated
    ) {

        if (userEmail == null || userEmail.trim().isEmpty()) {
            return;
        }

        Notification notification =
                new Notification();

        notification.setUserEmail(
                userEmail
        );

        notification.setTitle(
                title
        );

        notification.setMessage(
                message
        );

        notification.setType(
                "ANNOUNCEMENT"
        );

        // Every new notification starts UNREAD
        notification.setReadStatus(
                false
        );

        notification.setDateCreated(
                dateCreated
        );

        notificationRepository.save(
                notification
        );
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

        announcement.setTitle(
                updatedAnnouncement.getTitle()
        );

        announcement.setMessage(
                updatedAnnouncement.getMessage()
        );

        announcement.setAuthor(
                updatedAnnouncement.getAuthor()
        );

        announcement.setDatePosted(
                updatedAnnouncement.getDatePosted()
        );

        return announcementRepository.save(
                announcement
        );
    }

    // =========================================================
    // DELETE ANNOUNCEMENT
    // =========================================================

    @DeleteMapping("/{id}")
    public void deleteAnnouncement(
            @PathVariable Long id
    ) {
        announcementRepository.deleteById(id);
    }
}