package com.echo.echobackend.controller;

import com.echo.echobackend.model.User;
import com.echo.echobackend.service.UserService;
import com.echo.echobackend.service.FileStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.net.MalformedURLException;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;
    private final FileStorageService fileStorageService;
    private final HttpServletRequest request;

    @Autowired
    public UserController(UserService userService, FileStorageService fileStorageService, HttpServletRequest request) {
        this.userService = userService;
        this.fileStorageService = fileStorageService;
        this.request = request;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Object> getCurrentUser(java.security.Principal principal) {
        String username = principal.getName();
        return userService.findByUsername(username)
                .<ResponseEntity<Object>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body("Usuario no encontrado"));
    }

    @PutMapping("/{id}/profile-image")
    @PreAuthorize("hasAnyRole('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<?> uploadProfileImage(@PathVariable Long id, @RequestParam("image") MultipartFile image) {
        try {
            // Generar nombre único para la imagen
            String filename = "profile_" + id + "_" + System.currentTimeMillis() + "_" + image.getOriginalFilename();
            
            // Almacenar el archivo usando el servicio
            fileStorageService.storeFile(image, filename);

            // Actualiza el usuario con el nombre de archivo guardado
            User user = userService.findById(id).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            user.setProfileImage(filename);
            userService.updateUser(id, user);

            // Devolver un objeto JSON con el nombre del archivo
            return ResponseEntity.ok(Map.of("filename", filename));
        } catch (Exception e) {
            logger.error("Error al subir la imagen de perfil para el usuario {}", id, e);
            return new ResponseEntity<>("Error al subir la imagen de perfil: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/artists")
    public ResponseEntity<List<User>> getAllArtists() {
        try {
            List<User> publicProfiles = userService.findAllPublicProfiles();
            return ResponseEntity.ok(publicProfiles);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam(required = false) String username) {
        try {
            List<User> users;
            
            // Si no hay término de búsqueda o está vacío, devolver todos los usuarios
            if (username == null || username.trim().isEmpty()) {
                users = userService.findAll();
            } else {
                users = userService.searchByUsernameContaining(username);
            }
            
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Error al buscar usuarios: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
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

    @GetMapping("/profile-image/{filename:.+}")
    public ResponseEntity<org.springframework.core.io.Resource> serveProfileImage(@PathVariable String filename) {
        try {
            // Cargar el archivo como recurso usando el servicio
            org.springframework.core.io.Resource file = fileStorageService.loadFileAsResource(filename);

            // Determinar el tipo de contenido
            String contentType = null;
            try {
                contentType = request.getServletContext().getMimeType(file.getFile().getAbsolutePath());
            } catch (IOException ex) {
                // Fallback a tipo de contenido por defecto si no se puede determinar
                logger.warn("Could not determine file type for file: {}", filename, ex);
            }

            // Si no se encontró el tipo de contenido, usar un tipo por defecto
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFilename() + "\"")
                    .body(file);
        } catch (Exception e) {
            // Manejar errores, por ejemplo, archivo no encontrado
            logger.error("Error serving profile image {}", filename, e);
            return ResponseEntity.notFound().build();
        }
    }
}