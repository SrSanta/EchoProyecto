package com.echo.echobackend.repository;

import com.echo.echobackend.model.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SongRepository extends JpaRepository<Song, Long> {
    // Puedes añadir métodos personalizados aquí si los necesitas
}