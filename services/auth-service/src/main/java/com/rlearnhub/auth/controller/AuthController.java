package com.rlearnhub.auth.controller;

import com.rlearnhub.auth.entity.User;
import com.rlearnhub.auth.repository.UserRepository;
import com.rlearnhub.auth.service.JwtService;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
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
    private final JwtService jwtService;

    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public AuthController(
            UserRepository userRepository,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {

        if (loginRequest.getEmail() == null
                || loginRequest.getPassword() == null
                || loginRequest.getEmail().isBlank()
                || loginRequest.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Email and password are required.")
            );
        }

        String email = loginRequest.getEmail().trim();

        Optional<User> result = userRepository.findByEmail(email);

        if (result.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Invalid email or password.")
            );
        }

        User existingUser = result.get();

        if (!passwordEncoder.matches(
                loginRequest.getPassword(),
                existingUser.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Invalid email or password.")
            );
        }

        String token = jwtService.generateToken(
                existingUser.getId(),
                existingUser.getEmail(),
                existingUser.getRole()
        );

        return ResponseEntity.ok(toSafeResponse(existingUser, token));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User newUser) {

        if (newUser.getName() == null
                || newUser.getEmail() == null
                || newUser.getPassword() == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Name, email, and password are required.")
            );
        }

        String name = newUser.getName().trim();
        String email = newUser.getEmail().trim();
        String password = newUser.getPassword();

        if (name.isBlank() || email.isBlank() || password.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Name, email, and password cannot be blank.")
            );
        }

        if (password.length() < 8) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Password must be at least 8 characters long.")
            );
        }

        // Public registration must never grant elevated roles.
        String requestedRole = newUser.getRole();

        if (requestedRole != null
                && !requestedRole.isBlank()
                && !"STUDENT".equalsIgnoreCase(requestedRole.trim())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    Map.of("message",
                            "Public registration is only available for student accounts.")
            );
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of("message", "Email already exists.")
            );
        }

        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setRole("STUDENT");
        newUser.setPassword(passwordEncoder.encode(password));

        User savedUser = userRepository.save(newUser);

        String token = jwtService.generateToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toSafeResponse(savedUser, token));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader(
                    value = HttpHeaders.AUTHORIZATION,
                    required = false
            ) String authorizationHeader,
            @RequestBody Map<String, String> request) {

        // Require a Bearer token.
        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Authentication is required.")
            );
        }

        String token = authorizationHeader.substring(7);

        // Validate the JWT inside the auth service.
        if (!jwtService.isTokenValid(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Your session is invalid or expired.")
            );
        }

        // Identify the account using the signed JWT.
        Long userId;

        try {
            userId = jwtService.extractUserId(token);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Invalid authentication token.")
            );
        }

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Invalid authentication token.")
            );
        }

        if (request == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Password details are required.")
            );
        }

        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (currentPassword == null || currentPassword.isBlank()
                || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Current password and new password are required.")
            );
        }

        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "New password must be at least 8 characters long.")
            );
        }

        Optional<User> result = userRepository.findById(userId);

        if (result.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Account not found.")
            );
        }

        User user = result.get();

        // Verify the current password.
        if (!passwordEncoder.matches(
                currentPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Current password is incorrect.")
            );
        }

        // Reject a password that is identical to the current one.
        if (passwordEncoder.matches(
                newPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Choose a new password different from your current password.")
            );
        }

        // Hash the new password before saving it.
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(
                Map.of("message", "Password changed successfully.")
        );
    }

    private Map<String, Object> toSafeResponse(
            User user,
            String token) {

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("token", token);

        // Never return the password or its hash.
        return response;
    }
}