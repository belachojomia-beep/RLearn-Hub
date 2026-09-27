package com.rlearnhub.backend.repository;

import com.rlearnhub.backend.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectRepository
        extends JpaRepository<Subject, Long> {
}