package com.rlearnhub.backend.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class AnnouncementNotificationPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public AnnouncementNotificationPublisher(
            RabbitTemplate rabbitTemplate,
            ObjectMapper objectMapper) {
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
    }

    public void publish(AnnouncementNotificationEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.ANNOUNCEMENT_QUEUE,
                    payload
            );

        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(
                    "Failed to serialize announcement notification event",
                    exception
            );
        }
    }
}
