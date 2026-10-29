package com.rlearnhub.notification.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rlearnhub.notification.entity.Notification;
import com.rlearnhub.notification.repository.NotificationRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

@Component
public class AnnouncementNotificationConsumer {

    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    public AnnouncementNotificationConsumer(
            NotificationRepository notificationRepository,
            ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.objectMapper = objectMapper;
    }

    @RabbitListener(queues = RabbitMQConfig.ANNOUNCEMENT_QUEUE)
    public void receiveAnnouncement(String payload) {
        try {
            AnnouncementNotificationEvent event =
                    objectMapper.readValue(
                            payload,
                            AnnouncementNotificationEvent.class
                    );

            List<String> recipients = event.getRecipientEmails();

            if (recipients == null || recipients.isEmpty()) {
                return;
            }

            for (String email : recipients) {
                if (email == null || email.isBlank()) {
                    continue;
                }

                Notification notification = new Notification();
                notification.setUserEmail(email.trim());
                notification.setTitle(event.getTitle());
                notification.setMessage(event.getMessage());
                notification.setType(
                        event.getType() == null
                                ? "ANNOUNCEMENT"
                                : event.getType()
                );
                notification.setReadStatus(false);
                notification.setDateCreated(event.getDateCreated());

                notificationRepository.save(notification);
            }

        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Failed to read announcement notification message",
                    exception
            );
        }
    }
}
