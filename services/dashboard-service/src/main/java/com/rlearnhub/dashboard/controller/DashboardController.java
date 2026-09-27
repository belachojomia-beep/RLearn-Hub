package com.rlearnhub.dashboard.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class DashboardController {

    private final JdbcTemplate jdbcTemplate;

    public DashboardController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/dashboard/health")
    public Map<String, String> health() {
        return Map.of(
                "service", "dashboard-service",
                "status", "running"
        );
    }

    @GetMapping("/api/dashboard/stats")
    public Map<String, Integer> stats() {

        int resources = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM resources",
                Integer.class
        );

        int downloads = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM downloads",
                Integer.class
        );

        int subjects = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM subjects",
                Integer.class
        );

        return Map.of(
                "resources", resources,
                "downloads", downloads,
                "subjects", subjects
        );
    }
}