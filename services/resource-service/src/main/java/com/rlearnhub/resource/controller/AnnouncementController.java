package com.rlearnhub.resource.controller;

import com.rlearnhub.resource.entity.Announcement;
import com.rlearnhub.resource.repository.AnnouncementRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = "*")
public class AnnouncementController {

    private final AnnouncementRepository announcementRepository;

    public AnnouncementController(
            AnnouncementRepository announcementRepository
    ) {
        this.announcementRepository =
                announcementRepository;
    }

    @GetMapping
    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Announcement> getAnnouncementById(
            @PathVariable Long id
    ) {

        return announcementRepository
                .findById(id)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    @PostMapping
    public Announcement createAnnouncement(
            @RequestBody Announcement announcement
    ) {

        return announcementRepository.save(
                announcement
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Announcement> updateAnnouncement(
            @PathVariable Long id,
            @RequestBody Announcement announcementDetails
    ) {

        return announcementRepository
                .findById(id)
                .map(announcement -> {

                    announcement.setTitle(
                            announcementDetails
                                    .getTitle()
                    );

                    announcement.setMessage(
                            announcementDetails
                                    .getMessage()
                    );

                    announcement.setDate(
                            announcementDetails
                                    .getDate()
                    );

                    announcement.setAuthor(
                            announcementDetails
                                    .getAuthor()
                    );

                    Announcement updatedAnnouncement =
                            announcementRepository.save(
                                    announcement
                            );

                    return ResponseEntity.ok(
                            updatedAnnouncement
                    );
                })
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnnouncement(
            @PathVariable Long id
    ) {

        if (
                !announcementRepository
                        .existsById(id)
        ) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        announcementRepository.deleteById(id);

        return ResponseEntity
                .noContent()
                .build();
    }
}