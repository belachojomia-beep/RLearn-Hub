package com.rlearnhub.backend.dto;

public class AdminUserResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private boolean active;

    public AdminUserResponse() {
    }

    public AdminUserResponse(
            Long id,
            String name,
            String email,
            String role,
            boolean active
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public boolean isActive() {
        return active;
    }
}
