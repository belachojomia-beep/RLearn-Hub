package com.rlearnhub.resource.controller;

import com.rlearnhub.resource.entity.Subject;
import com.rlearnhub.resource.repository.SubjectRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@CrossOrigin(origins = "http://localhost:5173")
public class SubjectController {

    private final SubjectRepository subjectRepository;

    public SubjectController(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
    }

    @GetMapping
    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Subject> getSubjectById(
            @PathVariable Long id
    ) {
        return subjectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Subject> createSubject(
            @RequestBody Subject subject
    ) {
        return ResponseEntity.ok(
                subjectRepository.save(subject)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Subject> updateSubject(
            @PathVariable Long id,
            @RequestBody Subject updatedSubject
    ) {
        return subjectRepository.findById(id)
                .map(subject -> {
                    subject.setName(updatedSubject.getName());
                    subject.setDescription(updatedSubject.getDescription());
                    subject.setYearLevel(updatedSubject.getYearLevel());

                    return ResponseEntity.ok(
                            subjectRepository.save(subject)
                    );
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubject(
            @PathVariable Long id
    ) {
        if (!subjectRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        subjectRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}