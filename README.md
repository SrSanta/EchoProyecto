# EchoProyecto - Social Media Backend

## Overview

EchoProyecto is a backend application designed to power a social media platform. It provides core functionalities such as user registration, authentication, user profiles, and genre management. The project is built using Spring Boot and leverages Spring Security for authentication and authorization.

## Features

*   **User Management:**
    *   User registration with username, email, and password.
    *   Secure password storage using BCrypt.
    *   User login with JWT (JSON Web Token) authentication.
    *   Retrieving user information by ID.
*   **Authentication and Authorization:**
    *   JWT-based authentication for secure API access.
    *   Spring Security for handling authentication and authorization.
    *   Stateless session management.
*   **Genre Management:**
    *   Create, read, and delete genres.
    *   Retrieve all genres.
    *   Retrieve a specific genre by ID.
*   **RESTful API:**
    *   Well-defined REST endpoints for all functionalities.
    *   Clear HTTP status codes for responses.
* **Database:**
    * JPA repository for database interaction.

## Technologies Used

*   **Java:** Programming language.
*   **Spring Boot:** Framework for building the application.
*   **Spring Security:** For authentication and authorization.
*   **Spring Data JPA:** For database interaction.
*   **BCrypt:** For password hashing.
*   **JWT (JSON Web Token):** For authentication.
* **Maven:** For project management.

## Project Structure

The project follows a standard Spring Boot structure:

*   `src/main/java/com/echo/echobackend/`: Contains the main application code.
    *   `config/`: Configuration classes (e.g., `SecurityBeansConfig`).
    *   `controller/`: REST controllers (e.g., `AuthController`, `UserController`, `GenreController`).
    *   `model/`: Data models (e.g., `User`, `Genre`).
    *   `repository/`: Data access interfaces (e.g., `UserRepository`, `GenreRepository`).
    *   `security/`: Security-related classes (e.g., `JwtRequestFilter`, `MyUserDetailsService`).
    *   `service/`: Business logic services (e.g., `UserService`, `AuthService`, `GenreService`).
*   `src/main/resources/`: Application configuration files.

## Setup and Installation

1.  **Prerequisites:**
    *   Java Development Kit (JDK) 17 or higher.
    *   Maven.
    *   A database (e.g., MySQL, PostgreSQL) - *Configuration needed in `application.properties`*.

2.  **Clone the Repository:**
  bash git clone <repository-url> cd EchoProyecto
3.  **Database Configuration:**
    *   Configure the database connection details in `src/main/resources/application.properties`.
    *   Example:properties spring.datasource.url= jdbc: mysql: / / localhost: 3306/ echodb spring.datasource.username= your_ db_ username spring.datasource.password= your_ db_ password spring.jpa.hibernate. ddl- auto= update
4.  **Build the Project:**
   *    bash mvn clean install
5.  **Run the Application:**
   *   bash mvn spring-boot:run
6.  **Access the API:**
    *   The API will be available at `http://localhost:8080/api`.

## API Endpoints

### Authentication

*   `POST /api/auth/register`: Register a new user.
    *   Request body: json { "username": "newuser", "email": "newuser@example.com" ,  "password": "password123" }
    *   Response: `201 Created` on success, `400 Bad Request` on failure.
*   `POST /api/auth/login`: Login and get a JWT token.
    *   Request body: json { "username": "existinguser", "password": "password123" }
    *   Response: `200 OK` with a JWT token in the response body: json { "token": "your_jwt_token" }
    * `401 Unauthorized` on failure.

### Users

*   `GET /api/users/{id}`: Get a user by ID.
    *   Response: `200 OK` with user data, `404 Not Found` if user does not exist.

### Genres

*   `POST /api/genres`: Create a new genre.
    *   Request body: json { "name": "Action" }
    *   Response: `201 Created` with the created genre data.
*   `GET /api/genres`: Get all genres.
    *   Response: `200 OK` with a list of genres.
*   `GET /api/genres/{id}`: Get a genre by ID.
    *   Response: `200 OK` with genre data, `404 Not Found` if genre does not exist.
*   `DELETE /api/genres/{id}`: Delete a genre by ID.
    *   Response: `204 No Content` on success, `404 Not Found` if genre does not exist.

## Security

*   **JWT Authentication:** All API endpoints (except `/api/auth/login` and `/api/auth/register`) require a valid JWT token in the `Authorization` header.
*   **Password Hashing:** User passwords are encrypted using BCrypt.
* **CORS:** is disabled.

## Future Improvements

*   **User Profile Management:** Add endpoints for updating user profiles.
*   **Post Management:** Implement features for creating, reading, updating, and deleting posts.
*   **Follow/Unfollow:** Add functionality for users to follow other users.
*   **Comments:** Implement comment functionality for posts.
*   **Likes:** Add the ability to like posts and comments.
* **CORS:** Enable CORS.
* **Error Handling:** Improve error handling and response messages.
* **Testing:** Add unit and integration tests.
