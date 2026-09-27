package com.rlearnhub.auth.controller;

import com.rlearnhub.auth.entity.User;
import com.rlearnhub.auth.repository.UserRepository;
import com.rlearnhub.auth.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserRepository userRepository;

    private final JwtService jwtService;

    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public AuthController(
            UserRepository userRepository,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {

        Optional<User> user =
                userRepository.findByEmail(loginRequest.getEmail());

        if (user.isEmpty()) {
            return ResponseEntity
                    .status(401)
                    .body("Invalid email or password");
        }

        User existingUser = user.get();

        /*
         * Check the submitted password against
         * the BCrypt password stored in PostgreSQL.
         */
        if (!passwordEncoder.matches(
                loginRequest.getPassword(),
                existingUser.getPassword()
        )) {

            return ResponseEntity
                    .status(401)
                    .body("Invalid email or password");
        }

        /*
         * Generate JWT after successful login.
         */
        String token = jwtService.generateToken(
                existingUser.getId(),
                existingUser.getEmail(),
                existingUser.getRole()
        );

        /*
         * Return safe user information plus JWT.
         *
         * Password is NOT returned.
         */
        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("id", existingUser.getId());
        response.put("name", existingUser.getName());
        response.put("email", existingUser.getEmail());
        response.put("role", existingUser.getRole());
        response.put("token", token);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody User newUser
    ) {

        Optional<User> existingUser =
                userRepository.findByEmail(newUser.getEmail());

        if (existingUser.isPresent()) {
            return ResponseEntity
                    .badRequest()
                    .body("Email already exists");
        }

        /*
         * New users are STUDENTS by default.
         */
        newUser.setRole("STUDENT");

        /*
         * Encrypt the password before saving it.
         */
        newUser.setPassword(
                passwordEncoder.encode(
                        newUser.getPassword()
                )
        );

        User savedUser =
                userRepository.save(newUser);

        /*
         * Generate a JWT for the newly registered user.
         */
        String token = jwtService.generateToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole()
        );

        /*
         * Return safe information only.
         */
        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("id", savedUser.getId());
        response.put("name", savedUser.getName());
        response.put("email", savedUser.getEmail());
        response.put("role", savedUser.getRole());
        response.put("token", token);

        return ResponseEntity.ok(response);
    }
}