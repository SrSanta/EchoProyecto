package com.echo.echobackend.repository;

import com.echo.echobackend.model.Playlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlaylistRepository extends JpaRepository<Playlist, Long> {
    // Métodos para buscar playlists por usuario, etc.
}