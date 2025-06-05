package com.echo.echobackend.controller;

import com.echo.echobackend.model.User;
import com.echo.echobackend.service.AuthService;
import com.echo.echobackend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final AuthService authService;
    private final AuthenticationManager authenticationManager;

    public AuthController(UserService userService, AuthService authService, AuthenticationManager authenticationManager) {
        this.userService = userService;
        this.authService = authService;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, Object> registrationRequest) {

        String username = (String) registrationRequest.get("username");
        String email = (String) registrationRequest.get("email");
        String password = (String) registrationRequest.get("password");

        List<Map<String, String>> rolesData = new ArrayList<>();
        try {
            Object rolesObj = registrationRequest.get("roles");
            if (rolesObj instanceof List) {
                for (Object item : (List<?>) rolesObj) {
                    if (item instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, String> roleMap = (Map<String, String>) item;
                        rolesData.add(roleMap);
                    } else {
                        return new ResponseEntity<>(
                            "Formato de roles inválido. Se espera una lista de objetos con nombre de rol.", 
                            HttpStatus.BAD_REQUEST);
                    }
                }
            } else {
                return new ResponseEntity<>(
                    "El campo 'roles' debe ser una lista.", 
                    HttpStatus.BAD_REQUEST);
            }
        } catch (ClassCastException e) {
            return new ResponseEntity<>(
                "Formato de roles inválido: " + e.getMessage(), 
                HttpStatus.BAD_REQUEST);
        }

        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty() || email == null || email.trim().isEmpty() || rolesData == null || rolesData.isEmpty()) {
            return new ResponseEntity<>("Todos los campos y al menos un rol son obligatorios", HttpStatus.BAD_REQUEST);
        }

        for (Map<String, String> roleData : rolesData) {
            if (roleData == null || roleData.get("name") == null || roleData.get("name").trim().isEmpty()) {
                return new ResponseEntity<>("Formato de roles inválido. Se espera: [{name: 'ROLE_USER'}, ...]", HttpStatus.BAD_REQUEST);
            }
        }

        if (userService.existsByUsername(username)) {
            return new ResponseEntity<>("Nombre de usuario ya registrado", HttpStatus.BAD_REQUEST);
        }

        if (userService.existsByEmail(email)) {
            return new ResponseEntity<>("Email ya registrado", HttpStatus.BAD_REQUEST);
        }

        User newUser = userService.registerNewUser(username, email, password, rolesData);
        return new ResponseEntity<>(newUser, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String jwtToken = authService.generateToken(userDetails);

            return ResponseEntity.ok(Map.of("token", jwtToken));

        } catch (Exception e) {
            logger.error("Credenciales inválidas", e);
            return new ResponseEntity<>("Credenciales inválidas", HttpStatus.UNAUTHORIZED);
        }
    }
}