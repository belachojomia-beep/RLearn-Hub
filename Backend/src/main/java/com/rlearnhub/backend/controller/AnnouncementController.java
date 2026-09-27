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

    // ==========================================
    // GET ALL ANNOUNCEMENTS
    // ==========================================

        @GetMapping
        public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAllByOrderByIdDesc();
        }


    // ==========================================
    // GET ANNOUNCEMENT BY ID
    // ==========================================

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


    // ==========================================
    // CREATE ANNOUNCEMENT
    // ==========================================

    @PostMapping
    public Announcement createAnnouncement(
            @RequestBody Announcement announcement
    ) {

        // ------------------------------------------
        // 1. SAVE ANNOUNCEMENT
        // ------------------------------------------

        Announcement savedAnnouncement =
                announcementRepository.save(announcement);


        // ------------------------------------------
        // 2. FIND ALL STUDENTS
        // ------------------------------------------

        List<User> students =
                userRepository.findByRoleIgnoreCase("STUDENT");


        // ------------------------------------------
        // 3. CREATE NOTIFICATION FOR EACH STUDENT
        // ------------------------------------------

        for (User student : students) {

            Notification notification =
                    new Notification();

            notification.setUserEmail(
                    student.getEmail()
            );

            notification.setTitle(
                    "New Announcement"
            );

            notification.setMessage(
                    savedAnnouncement.getTitle()
                    + ": "
                    + savedAnnouncement.getMessage()
            );

            notification.setType(
                    "ANNOUNCEMENT"
            );

            notification.setReadStatus(
                    false
            );

            notification.setDateCreated(
                    savedAnnouncement.getDatePosted()
            );

            notificationRepository.save(
                    notification
            );
        }


        // ------------------------------------------
        // 4. RETURN SAVED ANNOUNCEMENT
        // ------------------------------------------

        return savedAnnouncement;
    }


    // ==========================================
    // UPDATE ANNOUNCEMENT
    // ==========================================

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


    // ==========================================
    // DELETE ANNOUNCEMENT
    // ==========================================

    @DeleteMapping("/{id}")
    public void deleteAnnouncement(
            @PathVariable Long id
    ) {

        announcementRepository.deleteById(id);
    }
}
