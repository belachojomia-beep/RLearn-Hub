# RLearn-Hub
## Rosemont Hills Montessori College Learning Resource Hub

RLearn-Hub is a web-based learning resource management system designed to help students and teachers access, share, and manage educational resources in one centralized platform.

The system aims to reduce the difficulties of sharing learning materials through separate messaging applications and email by providing a centralized hub for educational resources and announcements.

## Features

- **Authentication:** User registration and login.
- **JWT Security:** Token-based authentication for protected requests.
- **Role-Based Access Control:** Different permissions for Students, Teachers, and Administrators.
- **Learning Resources:** Access and manage educational materials according to assigned permissions.
- **Resource Management:** Support for resource submission and administrative review.
- **Announcements:** Publish and view school announcements.
- **Notifications:** Announcement events can be delivered through RabbitMQ to the Notification Service.
- **Admin Dashboard:** Administrative user management, dashboard information, and system operations.
- **Password Change:** Authenticated users can change their passwords.
- **Theme Selection:** Light and dark theme support.

## User Roles

### Student
- Access available learning resources.
- View and download educational materials where permitted.
- Read school announcements and relevant notifications.

### Teacher
- Access learning resources.
- Submit educational materials according to assigned permissions.
- Publish announcements according to authorization rules.
- Receive relevant school notifications.

### Administrator
- Manage users and learning resources.
- Review submitted materials where supported.
- Publish school announcements.
- Access administrative dashboard features.

Actual permissions are enforced by the application's backend and authorization configuration.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, JavaScript, Vite, CSS |
| Backend | Java, Spring Boot |
| API Gateway | Spring Cloud Gateway |
| Authentication | JWT and role-based authorization |
| Database | PostgreSQL |
| Messaging Broker | RabbitMQ |
| Inter-service Communication | REST APIs and message-based communication |
| Containerization | Docker and Docker Compose |
| Build Tools | Maven Wrapper and npm |
| API Testing | Postman |

## System Architecture

The application uses a microservices-based architecture. The React frontend sends API requests through the API Gateway. The gateway routes requests to the appropriate backend service.

```text
Student / Teacher / Administrator
                 |
                 v
       React Frontend (Vite)
                 |
                 v
       API Gateway :8080
                 |
       +---------+----------+
       |         |          |
       v         v          v
   Auth       Backend    Resource
 Service     :8081       Service
  :8085                   :8082
       |         |          |
       +---------+----------+
                 |
                 v
             PostgreSQL
               :5432


Announcement Publishing
          |
          v
     Backend API
          |
          v
      RabbitMQ
       :5672
          |
          v
  Notification Service
        :8083
          |
          v
 Announcement Notifications


Dashboard Service :8084
