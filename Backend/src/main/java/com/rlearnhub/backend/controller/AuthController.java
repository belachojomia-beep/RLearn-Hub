package com.rlearnhub.backend.controller;

import com.rlearnhub.backend.dto.LoginResponse;
import com.rlearnhub.backend.entity.User;
import com.rlearnhub.backend.repository.UserRepository;
import com.rlearnhub.backend.util.JwtUtil;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175"
})
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder =
        new BCryptPasswordEncoder();

    public AuthController(
            UserRepository userRepository,
            JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    // =========================
    // LOGIN
    // =========================
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody User loginRequest) {

        if (loginRequest.getEmail() == null
                || loginRequest.getPassword() == null
                || loginRequest.getEmail().isBlank()
                || loginRequest.getPassword().isBlank()) {

            return ResponseEntity.badRequest()
                .body(Map.of(
                    "message",
                    "Email and password are required."
                ));
        }

        String email = loginRequest.getEmail().trim();

        Optional<User> result =
            userRepository.findByEmail(email);

        if (result.isEmpty()) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                    "message",
                    "Invalid email or password."
                ));
        }

        User user = result.get();

        if (!passwordEncoder.matches(
                loginRequest.getPassword(),
                user.getPassword())) {

            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                    "message",
                    "Invalid email or password."
                ));
        }

        String token = jwtUtil.generateToken(
            user.getId(),
            user.getEmail(),
            user.getRole()
        );

        LoginResponse response = new LoginResponse(
            token,
            new LoginResponse.UserInfo(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
            )
        );

        return ResponseEntity.ok(response);
    }

    // =========================
    // PUBLIC REGISTRATION
    // STUDENTS ONLY
    // =========================
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody User newUser) {

        if (newUser.getName() == null
                || newUser.getEmail() == null
                || newUser.getPassword() == null
                || newUser.getRole() == null
                || newUser.getName().isBlank()
                || newUser.getEmail().isBlank()
                || newUser.getPassword().isBlank()
                || newUser.getRole().isBlank()) {

            return ResponseEntity.badRequest()
                .body(Map.of(
                    "message",
                    "All registration fields are required."
                ));
        }

        String name = newUser.getName().trim();
        String email = newUser.getEmail().trim();
        String role = newUser.getRole().trim().toUpperCase();

        if (name.isBlank() || email.isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "message",
                    "Name and email cannot be blank."
                ));
        }

        // Prevent public creation of Teacher and Admin accounts.
        if (!"STUDENT".equals(role)) {
            return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                    "message",
                    "Public registration is only available for student accounts."
                ));
        }

        // Check whether the email is already registered.
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "message",
                    "Email already exists."
                ));
        }

        // Store the account with a BCrypt password hash.
        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setRole("STUDENT");
        newUser.setPassword(
            passwordEncoder.encode(newUser.getPassword())
        );

        User saved = userRepository.save(newUser);

        // Return safe user information, never the password.
        LoginResponse.UserInfo response =
            new LoginResponse.UserInfo(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getRole()
            );

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(response);
    }
}