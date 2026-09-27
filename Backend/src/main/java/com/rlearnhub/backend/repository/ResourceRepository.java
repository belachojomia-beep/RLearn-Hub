package com.rlearnhub.backend.repository;

import com.rlearnhub.backend.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceRepository
        extends JpaRepository<Resource, Long> {

    List<Resource> findTop4ByOrderByIdDesc();
}