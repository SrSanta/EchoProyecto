package com.echo.echobackend.controller;

import com.echo.echobackend.model.User;
import com.echo.echobackend.service.AuthService;
import com.echo.echobackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final AuthService authService;
    private final AuthenticationManager authenticationManager; // Inyectamos el AuthenticationManager

    @Autowired
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
        List<Map<String, String>> rolesData = (List<Map<String, String>>) registrationRequest.get("roles"); // Obtén la lista de roles

        // Validación de campos obligatorios
        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty() || email == null || email.trim().isEmpty() || rolesData == null || rolesData.isEmpty()) {
            return new ResponseEntity<>("Todos los campos y al menos un rol son obligatorios", HttpStatus.BAD_REQUEST);
        }

        // Validación de formato de roles (opcional, pero recomendado)
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

        User newUser = userService.registerNewUser(username, email, password, rolesData); // Pasa la lista de roles al servicio
        return new ResponseEntity<>("Usuario registrado exitosamente", HttpStatus.CREATED);
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
        e.printStackTrace();
        return new ResponseEntity<>("Credenciales inválidas", HttpStatus.UNAUTHORIZED);
    }

}
}