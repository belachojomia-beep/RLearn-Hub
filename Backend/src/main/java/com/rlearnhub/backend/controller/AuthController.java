package com.rlearnhub.backend.controller;

import com.rlearnhub.backend.entity.User;
import com.rlearnhub.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody User loginRequest
    ) {

        Optional<User> user =
                userRepository.findByEmail(
                        loginRequest.getEmail()
                );

        if (user.isEmpty()) {
            return ResponseEntity
                    .status(401)
                    .body("Invalid email or password");
        }

        BCryptPasswordEncoder passwordEncoder =
        new BCryptPasswordEncoder();

if (!passwordEncoder.matches(
        loginRequest.getPassword(),
        user.get().getPassword())) {

    return ResponseEntity
            .status(401)
            .body("Invalid email or password");
}

        return ResponseEntity.ok(user.get());
    }

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody User newUser
    ) {

        Optional<User> existingUser =
                userRepository.findByEmail(
                        newUser.getEmail()
                );

        if (existingUser.isPresent()) {
            return ResponseEntity
                    .badRequest()
                    .body("Email already exists");
        }

        User savedUser =
                userRepository.save(newUser);

        return ResponseEntity.ok(savedUser);
    }
}