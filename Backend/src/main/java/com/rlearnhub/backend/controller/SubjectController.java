package com.rlearnhub.backend.controller;

import com.rlearnhub.backend.entity.Subject;
import com.rlearnhub.backend.repository.SubjectRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@CrossOrigin(origins = "http://localhost:5173")
public class SubjectController {

    private final SubjectRepository subjectRepository;

    public SubjectController(
            SubjectRepository subjectRepository
    ) {
        this.subjectRepository = subjectRepository;
    }

    // GET ALL SUBJECTS
    @GetMapping
    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    // GET ONE SUBJECT
    @GetMapping("/{id}")
    public Subject getSubject(
            @PathVariable Long id
    ) {
        return subjectRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Subject not found"
                        )
                );
    }

    // CREATE SUBJECT
    @PostMapping
    public Subject createSubject(
            @RequestBody Subject subject
    ) {
        return subjectRepository.save(subject);
    }

    // UPDATE SUBJECT
    @PutMapping("/{id}")
    public Subject updateSubject(
            @PathVariable Long id,
            @RequestBody Subject updatedSubject
    ) {
        Subject subject =
                subjectRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Subject not found"
                                )
                        );

        subject.setName(
                updatedSubject.getName()
        );

        subject.setDescription(
                updatedSubject.getDescription()
        );

        subject.setYearLevel(
                updatedSubject.getYearLevel()
        );

        return subjectRepository.save(subject);
    }

    // DELETE SUBJECT
    @DeleteMapping("/{id}")
    public void deleteSubject(
            @PathVariable Long id
    ) {
        subjectRepository.deleteById(id);
    }
}