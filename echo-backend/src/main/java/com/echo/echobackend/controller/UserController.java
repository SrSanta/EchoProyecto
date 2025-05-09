package com.echo.echobackend.controller;

import com.echo.echobackend.model.User;
import com.echo.echobackend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.findById(id);
        return user.map(ResponseEntity::ok)
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER, ROLE_ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
        try {
            User savedUser = userService.updateUser(id, updatedUser);
            return ResponseEntity.ok(savedUser);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteById(id);
    }


    @PutMapping("/{id}/password")
    @PreAuthorize("hasRole('ROLE_USER, ROLE_ADMIN')")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody Map<String, String> passwordRequest) {
        String newPassword = passwordRequest.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return new ResponseEntity<>("La nueva contraseña es obligatoria", HttpStatus.BAD_REQUEST);
        }
        userService.changePassword(id, newPassword);
        return ResponseEntity.ok("Contraseña actualizada exitosamente");
    }
}