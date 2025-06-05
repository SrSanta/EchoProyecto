package com.echo.echobackend.service;

import com.echo.echobackend.model.User;
import com.echo.echobackend.model.Role;
import com.echo.echobackend.repository.UserRepository;
import com.echo.echobackend.repository.RoleRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

    public UserService(UserRepository userRepository, @Lazy PasswordEncoder passwordEncoder, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public boolean existsByUsername(String username) {
        return userRepository.findByUsername(username).isPresent();
    }

    public boolean existsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    public User registerNewUser(String username, String email, String password, List<Map<String, String>> rolesData) {
        User newUser = new User();
        newUser.setUsername(username);
        newUser.setEmail(email);
        newUser.setPassword(passwordEncoder.encode(password));
        newUser.setRegistrationDate(LocalDateTime.now());

        List<Role> roles = rolesData.stream()
                .map(roleData -> {
                    String roleName = roleData.get("name");
                    return roleRepository.findByName(roleName)
                            .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
                })
                .collect(Collectors.toList());
        newUser.setRoles(roles);

        return userRepository.save(newUser);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User updateUser(Long id, User userDetails) {
        return userRepository.findById(id).map(user -> {
            user.setUsername(userDetails.getUsername());
            user.setEmail(userDetails.getEmail());

            // --- Inicio: Lógica para actualizar roles preservando ROLE_ARTIST ---
            List<Role> currentRoles = user.getRoles();
            boolean wasArtist = currentRoles != null && currentRoles.stream()
                                    .anyMatch(role -> "ROLE_ARTIST".equals(role.getName()));

            List<Role> rolesFromDetails = getRolesFromDetails(userDetails.getRoles());

            List<Role> finalRoles = new java.util.ArrayList<>(rolesFromDetails);

            if (wasArtist && finalRoles.stream().noneMatch(role -> "ROLE_ARTIST".equals(role.getName()))) {
                 roleRepository.findByName("ROLE_ARTIST")
                    .ifPresent(finalRoles::add);
            }

            user.setRoles(finalRoles);
            // --- Fin: Lógica para actualizar roles preservando ROLE_ARTIST ---

            // Permitir actualizar profileImage si se envía en userDetails (asumiendo que este campo también viene)
            if (userDetails.getProfileImage() != null) {
                 user.setProfileImage(userDetails.getProfileImage());
            }

            return userRepository.save(user); // Guardar el usuario con los roles y potentially profile image actualizados
        }).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private List<Role> getRolesFromDetails(List<Role> userDetailsRoles) {
        if (userDetailsRoles == null) {
            return new java.util.ArrayList<>();
        }
        return userDetailsRoles.stream()
                .map(roleDetail -> {
                    String roleName = roleDetail.getName();
                    return roleRepository.findByName(roleName)
                            .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
                })
                .collect(Collectors.toList());
    }

    public void changePassword(Long userId, String newPassword) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
        });
    }

    public boolean checkPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }

    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }
    
    public List<User> searchByUsernameContaining(String username) {
        return userRepository.findByUsernameContainingIgnoreCase(username);
    }
    
    public List<User> findAll() {
        return userRepository.findAll();
    }
    
    public List<User> findAllArtists() {
        return userRepository.findByRoles_Name("ROLE_ARTIST");
    }

    public List<User> findAllPublicProfiles() {
        return userRepository.findByIsProfilePublic(true);
    }
}
