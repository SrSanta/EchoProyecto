package com.echo.echobackend.repository;

import com.echo.echobackend.model.PlaylistSong;
import com.echo.echobackend.model.PlaylistSongId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlaylistSongRepository extends JpaRepository<PlaylistSong, PlaylistSongId> {
    // Métodos para buscar canciones en una playlist, etc.
}