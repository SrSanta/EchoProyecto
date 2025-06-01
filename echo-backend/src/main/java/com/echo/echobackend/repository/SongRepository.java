package com.echo.echobackend.repository;

import com.echo.echobackend.model.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.echo.echobackend.model.User;

import java.util.List;

@Repository
public interface SongRepository extends JpaRepository<Song, Long> {
    List<Song> findByGenre_Name(String genreName);
    List<Song> findByUserUsernameContainingIgnoreCase(String artist);
    List<Song> findByTitleContainingIgnoreCase(String title);
    long countByUser(User user);
    List<Song> findByUser(User user);
}