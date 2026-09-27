package com.rlearnhub.resource.service;

import com.rlearnhub.resource.entity.Resource;
import com.rlearnhub.resource.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    public Optional<Resource> getResourceById(Long id) {
        return resourceRepository.findById(id);
    }

    public Resource createResource(Resource resource) {
        return resourceRepository.save(resource);
    }

    public Resource updateResource(Long id, Resource updatedResource) {

        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        resource.setTitle(updatedResource.getTitle());
        resource.setSubject(updatedResource.getSubject());
        resource.setTopic(updatedResource.getTopic());
        resource.setYearLevel(updatedResource.getYearLevel());
        resource.setAuthor(updatedResource.getAuthor());
        resource.setDateAdded(updatedResource.getDateAdded());
        resource.setType(updatedResource.getType());
        resource.setSize(updatedResource.getSize());
        resource.setFileName(updatedResource.getFileName());
        resource.setFilePath(updatedResource.getFilePath());

        return resourceRepository.save(resource);
    }

    public void deleteResource(Long id) {

        if (!resourceRepository.existsById(id)) {
            throw new RuntimeException("Resource not found");
        }

        resourceRepository.deleteById(id);
    }

    public List<Resource> getRecentResources() {
        return resourceRepository.findTop4ByOrderByIdDesc();
    }
}