package com.echo.echobackend.repository;

import com.echo.echobackend.model.Playlist;
import com.echo.echobackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaylistRepository extends JpaRepository<Playlist, Long> {
    List<Playlist> findByUser(User user);
    List<Playlist> findByIsPublicTrue();
    
    List<Playlist> findByNameContainingIgnoreCase(String name);
}