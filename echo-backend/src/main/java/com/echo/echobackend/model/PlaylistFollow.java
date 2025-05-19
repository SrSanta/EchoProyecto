package com.echo.echobackend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "playlist_follows")
@Data
@NoArgsConstructor
public class PlaylistFollow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "playlist_id")
    private Playlist playlist;

    @Column(nullable = false)
    private boolean favorite = false;

    // Puedes agregar campos de fecha si quieres auditar cuándo se siguió
}
