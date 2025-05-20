package com.echo.echobackend.controller;

import com.echo.echobackend.model.User;
import com.echo.echobackend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Object> getCurrentUser(java.security.Principal principal) {
        String username = principal.getName();
        return userService.findByUsername(username)
                .<ResponseEntity<Object>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body("Usuario no encontrado"));
    }

    @PutMapping("/{id}/profile-image")
    @PreAuthorize("hasRole('ROLE_USER, ROLE_ADMIN')")
    public ResponseEntity<?> uploadProfileImage(@PathVariable Long id, @RequestParam("image") MultipartFile image) {
        try {
            // Directorio donde se guardan las imágenes
            String uploadDir = System.getProperty("user.dir") + "/mis_uploads/";
            java.io.File dir = new java.io.File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            // Nombre único para la imagen
            String filename = "profile_" + id + "_" + System.currentTimeMillis() + "_" + image.getOriginalFilename();
            java.nio.file.Path filepath = java.nio.file.Paths.get(uploadDir, filename);
            image.transferTo(filepath);

            // Actualiza el usuario
            User user = userService.findById(id).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            user.setProfileImage(filename);
            userService.updateUser(id, user);

            return ResponseEntity.ok(filename);
        } catch (Exception e) {
            return new ResponseEntity<>("Error al subir la imagen de perfil: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

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
    @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_USER')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updatedUser, java.security.Principal principal) {
        try {
            if (updatedUser.getUsername() == null || updatedUser.getEmail() == null) {
                return new ResponseEntity<>("Username y Email son obligatorios", HttpStatus.BAD_REQUEST);
            }
            // Permitir solo si es admin o el dueño del perfil
            boolean isAdmin = false;
            String username = principal.getName();
            // Busca el usuario autenticado por username
            Optional<User> authUserOpt = userService.findByUsername(username);
            if (authUserOpt.isPresent()) {
                User authUser = authUserOpt.get();
                isAdmin = authUser.getRoles().stream().anyMatch(role -> role.getName().equals("ROLE_ADMIN"));
                if (!isAdmin && !authUser.getId().equals(id)) {
                    return new ResponseEntity<>("No tienes permiso para editar este usuario", HttpStatus.FORBIDDEN);
                }
            } else {
                return new ResponseEntity<>("Usuario autenticado no encontrado", HttpStatus.FORBIDDEN);
            }
            User savedUser = userService.updateUser(id, updatedUser);
            return ResponseEntity.ok(savedUser);
        } catch (RuntimeException e) {
            e.printStackTrace();
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Error interno del servidor", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteById(id);
    }


    @PutMapping("/{id}/password")
    @PreAuthorize("hasRole('ROLE_USER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody Map<String, String> passwordRequest, java.security.Principal principal) {
        String newPassword = passwordRequest.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return new ResponseEntity<>("La nueva contraseña es obligatoria", HttpStatus.BAD_REQUEST);
        }
        // Solo el dueño del perfil o un admin puede cambiar la contraseña
        String username = principal.getName();
        Optional<User> authUserOpt = userService.findByUsername(username);
        if (authUserOpt.isPresent()) {
            User authUser = authUserOpt.get();
            boolean isAdmin = authUser.getRoles().stream().anyMatch(role -> role.getName().equals("ROLE_ADMIN"));
            if (!isAdmin && !authUser.getId().equals(id)) {
                return new ResponseEntity<>("No tienes permiso para cambiar la contraseña de este usuario", HttpStatus.FORBIDDEN);
            }
        } else {
            return new ResponseEntity<>("Usuario autenticado no encontrado", HttpStatus.FORBIDDEN);
        }
        String currentPassword = passwordRequest.get("currentPassword");
        if (currentPassword == null || currentPassword.trim().isEmpty()) {
            return new ResponseEntity<>("La contraseña actual es obligatoria", HttpStatus.BAD_REQUEST);
        }
        User user = userService.findById(id).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (!userService.checkPassword(user, currentPassword)) {
            return new ResponseEntity<>("La contraseña actual no es correcta", HttpStatus.FORBIDDEN);
        }
        userService.changePassword(id, newPassword);
        return ResponseEntity.ok("Contraseña actualizada exitosamente");
    }
}