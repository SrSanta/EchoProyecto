package com.echo.echobackend.repository;

import com.echo.echobackend.model.Playlist;
import com.echo.echobackend.model.PlaylistFollow;
import com.echo.echobackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaylistFollowRepository extends JpaRepository<PlaylistFollow, Long> {
    Optional<PlaylistFollow> findByUserAndPlaylist(User user, Playlist playlist);
    List<PlaylistFollow> findByUser(User user);
    List<PlaylistFollow> findByPlaylist(Playlist playlist);
    void deleteByUserAndPlaylist(User user, Playlist playlist);
}
