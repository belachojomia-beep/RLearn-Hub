package com.rlearnhub.resource.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "downloads")
public class Download {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long resourceId;

    @Column(nullable = false)
    private String resourceTitle;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String downloadedAt;

    public Download() {
    }

    public Download(
            Long resourceId,
            String resourceTitle,
            String userEmail,
            String downloadedAt
    ) {
        this.resourceId = resourceId;
        this.resourceTitle = resourceTitle;
        this.userEmail = userEmail;
        this.downloadedAt = downloadedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getResourceId() {
        return resourceId;
    }

    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }

    public String getResourceTitle() {
        return resourceTitle;
    }

    public void setResourceTitle(String resourceTitle) {
        this.resourceTitle = resourceTitle;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getDownloadedAt() {
        return downloadedAt;
    }

    public void setDownloadedAt(String downloadedAt) {
        this.downloadedAt = downloadedAt;
    }
}