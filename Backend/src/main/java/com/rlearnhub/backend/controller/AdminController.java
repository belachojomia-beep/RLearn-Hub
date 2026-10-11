
package com.rlearnhub.backend.controller;

import com.rlearnhub.backend.dto.AdminUserResponse;
import com.rlearnhub.backend.entity.User;
import com.rlearnhub.backend.repository.UserRepository;
import com.rlearnhub.backend.util.JwtUtil;

import io.jsonwebtoken.Claims;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public AdminController(
            UserRepository userRepository,
            JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestHeader(
                value = HttpHeaders.AUTHORIZATION,
                required = false
            ) String authorization) {

        if (!isAdmin(authorization)) {
            return unauthorizedOrForbidden(authorization);
        }

        List<AdminUserResponse> users =
                userRepository.findAll()
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(users);
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(
            @RequestHeader(
                value = HttpHeaders.AUTHORIZATION,
                required = false
            ) String authorization,
            @RequestBody Map<String, String> request) {

        if (!isAdmin(authorization)) {
            return unauthorizedOrForbidden(authorization);
        }

        String name = request.get("name");
        String email = request.get("email");
        String password = request.get("password");
        String role = request.get("role");

        if (name == null || email == null
                || password == null || role == null
                || name.isBlank() || email.isBlank()
                || password.isBlank() || role.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Name, email, password, and role are required.")
            );
        }

        name = name.trim();
        email = email.trim();
        role = role.trim().toUpperCase();

        if (!role.equals("STUDENT") && !role.equals("TEACHER")) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Only STUDENT and TEACHER accounts can be created here.")
            );
        }

        if (password.length() < 8) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Password must be at least 8 characters long.")
            );
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of("message", "Email already exists.")
            );
        }

        User newUser = new User();
        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setRole(role);
        newUser.setPassword(passwordEncoder.encode(password));

        User saved = userRepository.save(newUser);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                toResponse(saved)
        );
    }

    private boolean isAdmin(String authorization) {
        if (authorization == null
                || !authorization.startsWith("Bearer ")) {
            return false;
        }

        String token = authorization.substring(7).trim();

        if (token.isEmpty() || !jwtUtil.isTokenValid(token)) {
            return false;
        }

        try {
            Claims claims = jwtUtil.extractClaims(token);
            String role = claims.get("role", String.class);

            if (!"ADMIN".equals(role)) {
                return false;
            }

            String email = claims.getSubject();

            return email != null
                    && userRepository.findByEmail(email)
                            .map(user -> "ADMIN".equals(user.getRole()))
                            .orElse(false);

        } catch (Exception exception) {
            return false;
        }
    }

    private ResponseEntity<Map<String, String>>
            unauthorizedOrForbidden(String authorization) {

        if (authorization == null
                || !authorization.startsWith("Bearer ")
                || !jwtUtil.isTokenValid(
                        authorization.substring(7).trim())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "A valid Bearer token is required.")
            );
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                Map.of("message",
                        "Administrator access is required.")
        );
    }

    private AdminUserResponse toResponse(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
