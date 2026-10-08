package com.rlearnhub.resource.repository;

import com.rlearnhub.resource.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    List<Resource> findTop4ByOrderByIdDesc();

    List<Resource> findByStatusIgnoreCase(String status);

    List<Resource> findByStatusIgnoreCaseOrderByIdDesc(String status);
}