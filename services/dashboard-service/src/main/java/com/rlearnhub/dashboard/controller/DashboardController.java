
package com.rlearnhub.dashboard.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public Map<String, Long> stats(
            @RequestParam String email
    ) {
        // Count only approved resources available to users.
        Long resources = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM resources
                WHERE UPPER(status) = 'APPROVED'
                """,
                Long.class
        );

        // Count downloads belonging to this logged-in user.
        Long downloads = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM downloads
                WHERE LOWER(user_email) = LOWER(?)
                """,
                Long.class,
                email.trim()
        );

        // Keep the existing total subject count.
        Long subjects = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM subjects",
                Long.class
        );

        return Map.of(
                "resources", resources,
                "downloads", downloads,
                "subjects", subjects
        );
    }
}
