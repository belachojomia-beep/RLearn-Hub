package com.rlearnhub.notification.messaging;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
public class RabbitMQConfig {

    public static final String ANNOUNCEMENT_QUEUE =
            "rlearnhub.announcements";

    @Bean
    public Queue announcementQueue() {
        return new Queue(ANNOUNCEMENT_QUEUE, true);
    }
}