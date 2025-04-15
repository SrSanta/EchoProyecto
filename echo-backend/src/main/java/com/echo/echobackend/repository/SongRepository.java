package com.echo.echobackend.repository;

import com.echo.echobackend.model.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SongRepository extends JpaRepository<Song, Long> {
    List<Song> findByGenre_Name(String genreName); // Búsqueda EXACTA por nombre de género
    List<Song> findByUserUsernameContainingIgnoreCase(String artist); // Búsqueda PARCIAL e INSENSIBLE a mayúsculas/minúsculas por artista
    List<Song> findByTitleContainingIgnoreCase(String title);  // Búsqueda PARCIAL e INSENSIBLE a mayúsculas/minúsculas por título
    // Puedes añadir métodos personalizados aquí si los necesitas
}