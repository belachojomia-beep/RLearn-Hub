# RLearn-Hub
## Rosemont Hills Montessori College Learning Resource Hub

RLearn-Hub is a web-based learning resource management system designed to help students and teachers access, share, and manage educational resources in one centralized platform.

The system aims to reduce the difficulties of sharing learning materials through separate messaging applications and email by providing a centralized hub for educational resources and announcements.

## Key Features

- **User Authentication:** Login and authentication for registered users.
- **Role-Based Access Control:** Separate permissions for Students, Teachers, and Administrators.
- **Learning Resources:** Browse, view, and download available educational resources.
- **Resource Uploads:** Allow authorized users to submit learning materials according to their permissions.
- **Resource Review:** Administrators can review submitted resources and approve or reject them.
- **Announcements:** Publish and view school announcements.
- **Admin Dashboard:** View system statistics and manage resources and users.
- **Theme Selection:** Switch between dark and light modes.

## User Roles

### Student
- Access approved learning resources.
- View and download available materials.
- Read school announcements.

### Teacher
- Access learning resources.
- Submit educational materials according to assigned permissions.
- View school announcements.

### Administrator
- Manage users and learning resources.
- Review submitted materials.
- Publish announcements.
- View administrative statistics and reports.

## Technology Stack

- **Frontend:** React, JavaScript, Vite, CSS
- **Backend:** Java and Spring Boot
- **API Gateway:** Spring Cloud Gateway
- **Database:** PostgreSQL
- **Containerization:** Docker and Docker Compose
- **Build Tools:** Maven Wrapper and npm

## System Architecture

RLearn-Hub uses a microservices-based architecture. The frontend communicates with the API Gateway, which routes requests to the appropriate backend service.

The application includes these components:

| Component | Local Port | Responsibility |
|---|---:|---|
| API Gateway | 8080 | Routes frontend API requests |
| Backend | 8081 | Administrative and backend operations |
| Resource Service | 8082 | Learning resource operations |
| Announcement Service | 8083 | Announcement operations |
| Dashboard Service | 8084 | Dashboard statistics |
| Auth Service | 8085 | Authentication |
| PostgreSQL | 5432 | Database storage |

The ports above describe the current local development configuration. They do not necessarily represent the final production deployment configuration.

## Prerequisites

Install the following before running the project:

- Git
- Node.js and npm
- Java Development Kit (JDK) 21
- Docker Desktop with Docker Compose

## Configuration

Sensitive configuration values must be stored in a local `.env` file in the project root. Do not commit `.env` or publish its contents.

Required environment variables include:

- `DB_PASSWORD` — PostgreSQL database password.
- `JWT_SECRET` — Secret used for JWT authentication.

Use the actual database password configured for your existing PostgreSQL database. The JWT secret should be a strong, randomly generated value of at least 32 characters.

Before starting the application, verify that the environment variables are loaded into the terminal or supplied to the services through the appropriate configuration mechanism.

## Running the Project Locally

### 1. Start Docker

Open Docker Desktop and ensure the PostgreSQL container is running.

From the project root, validate the Docker Compose configuration:

```powershell
docker compose config --quiet
```

### 2. Start the backend services

Start each Spring Boot application using its Maven Wrapper from a separate terminal, or use a verified orchestration script if one is available.

The main service directories are:

- `Backend`
- `gateway/api-gateway`
- `services/auth-service`
- `services/resource-service`
- `services/announcement-service`
- `services/dashboard-service`

Confirm each service's configuration and required environment variables before starting it.

### 3. Start the frontend

Open a terminal and run:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal.

### 4. Build the frontend for production

From the `frontend` directory, run:

```powershell
npm run build
```

A successful build creates the production files in the `frontend/dist` directory.

## API Gateway

The frontend is configured to send API requests through the gateway at:

```text
http://localhost:8080
```

The gateway routes requests to the relevant internal service. Although the services use separate ports during local development, the gateway provides a single API entry point for the frontend.

## Security Notes

- Never commit passwords, JWT secrets, access tokens, or other credentials.
- Keep `.env` out of version control.
- Use role-based authorization for protected operations.
- Do not expose internal service ports publicly in production unless required.
- Use HTTPS and production-grade secret management when deploying.
- Review application logs before sharing them, because logs may contain sensitive operational information.

## Testing and Verification

Before a demonstration or deployment:

- Verify that all required services start successfully.
- Test login for each user role.
- Check resource viewing and downloading.
- Verify resource approval and rejection permissions.
- Test announcement creation and display.
- Check dashboard statistics.
- Run the frontend production build.
- Verify database connectivity and gateway routing.

## Project Status

The frontend production build and Docker Compose configuration have been verified successfully in the current development environment. Individual services have also been found listening on their expected local ports.

Production deployment, complete end-to-end verification, and final documentation review should be completed before describing the system as production-ready.

## Repository

GitHub repository: https://github.com/belachojomia-beep/RLearn-Hub
