package com.rlearnhub.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "resources")
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String topic;

    @Column(nullable = false)
    private String yearLevel;

    @Column(nullable = false)
    private String author;

    @Column(nullable = false)
    private String dateAdded;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String size;

    @Column
    private String fileName;

    @Column
    private String filePath;

    @Column(nullable = false)
    private String status = "PENDING";

    // Default constructor
    public Resource() {
    }

    // Constructor
    public Resource(
            String title,
            String subject,
            String topic,
            String yearLevel,
            String author,
            String dateAdded,
            String type,
            String size
    ) {
        this.title = title;
        this.subject = subject;
        this.topic = topic;
        this.yearLevel = yearLevel;
        this.author = author;
        this.dateAdded = dateAdded;
        this.type = type;
        this.size = size;
    }

    // ID
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    // Title
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    // Subject
    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    // Topic
    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    // Year Level
    public String getYearLevel() {
        return yearLevel;
    }

    public void setYearLevel(String yearLevel) {
        this.yearLevel = yearLevel;
    }

    // Author
    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    // Date Added
    public String getDateAdded() {
        return dateAdded;
    }

    public void setDateAdded(String dateAdded) {
        this.dateAdded = dateAdded;
    }

    // Type
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    // Size
    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    // File Name
    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    // File Path
    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    // Status
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}