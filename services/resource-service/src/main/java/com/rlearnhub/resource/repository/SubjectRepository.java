package com.rlearnhub.resource.repository;

import com.rlearnhub.resource.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
}