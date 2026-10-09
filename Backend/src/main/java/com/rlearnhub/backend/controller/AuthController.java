
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

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody User loginRequest) {

        if (loginRequest.getEmail() == null
                || loginRequest.getPassword() == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("message",
                    "Email and password are required."));
        }

        Optional<User> result =
            userRepository.findByEmail(loginRequest.getEmail());

        if (result.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message",
                    "Invalid email or password."));
        }

        User user = result.get();

        if (!passwordEncoder.matches(
                loginRequest.getPassword(),
                user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message",
                    "Invalid email or password."));
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
                .body(Map.of("message",
                    "All registration fields are required."));
        }

        String role = newUser.getRole().trim().toUpperCase();

        if (!role.equals("STUDENT")
                && !role.equals("TEACHER")
                && !role.equals("ADMIN")) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Invalid role."));
        }

        if (userRepository.findByEmail(
                newUser.getEmail().trim()).isPresent()) {
            return ResponseEntity.badRequest()
                .body(Map.of("message",
                    "Email already exists."));
        }

        newUser.setName(newUser.getName().trim());
        newUser.setEmail(newUser.getEmail().trim());
        newUser.setRole(role);
        newUser.setPassword(
            passwordEncoder.encode(newUser.getPassword())
        );

        User saved = userRepository.save(newUser);

        return ResponseEntity.status(HttpStatus.CREATED).body(
            new LoginResponse.UserInfo(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getRole()
            )
        );
    }
}