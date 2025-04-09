package com.echo.echobackend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    @ManyToMany(fetch = FetchType.EAGER) // Cargar los roles al cargar el usuario
    @JoinTable(
            name = "users_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private List<Role> roles;

    private LocalDateTime registrationDate;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean isProfilePublic;

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<Song> songs;

    @OneToMany(mappedBy = "user") // Futuro
    private List<Playlist> playlists;

    @OneToMany(mappedBy = "user") // Futuro
    private List<Like> likes;

    @OneToMany(mappedBy = "user") // Futuro
    private List<PlaybackHistory> playbackHistory;
}