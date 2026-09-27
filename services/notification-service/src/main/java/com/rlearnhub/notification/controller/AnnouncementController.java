package com.rlearnhub.notification.controller;

import com.rlearnhub.notification.entity.Announcement;
import com.rlearnhub.notification.repository.AnnouncementRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = "http://localhost:5173")
public class AnnouncementController {

    private final AnnouncementRepository announcementRepository;

    public AnnouncementController(
            AnnouncementRepository announcementRepository
    ) {
        this.announcementRepository = announcementRepository;
    }

    // =========================================================
    // GET ALL ANNOUNCEMENTS
    // =========================================================

    @GetMapping
    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAll();
    }

    // =========================================================
    // GET ONE ANNOUNCEMENT
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<Announcement> getAnnouncementById(
            @PathVariable Long id
    ) {
        return announcementRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================================================
    // CREATE ANNOUNCEMENT
    // =========================================================

    @PostMapping
    public ResponseEntity<Announcement> createAnnouncement(
            @RequestBody Announcement announcement
    ) {
        return ResponseEntity.ok(
                announcementRepository.save(announcement)
        );
    }

    // =========================================================
    // UPDATE ANNOUNCEMENT
    // =========================================================

    @PutMapping("/{id}")
    public ResponseEntity<Announcement> updateAnnouncement(
            @PathVariable Long id,
            @RequestBody Announcement updatedAnnouncement
    ) {

        return announcementRepository.findById(id)
                .map(announcement -> {

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

                    return ResponseEntity.ok(
                            announcementRepository.save(announcement)
                    );
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================================================
    // DELETE ANNOUNCEMENT
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnnouncement(
            @PathVariable Long id
    ) {

        if (!announcementRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        announcementRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}