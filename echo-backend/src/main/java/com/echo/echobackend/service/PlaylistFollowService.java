package com.echo.echobackend.service;

import com.echo.echobackend.exception.ResourceNotFoundException;
import com.echo.echobackend.model.Playlist;
import com.echo.echobackend.model.PlaylistFollow;
import com.echo.echobackend.model.User;
import com.echo.echobackend.repository.PlaylistFollowRepository;
import com.echo.echobackend.repository.PlaylistRepository;
import com.echo.echobackend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlaylistFollowService {
    private final PlaylistFollowRepository followRepository;
    private final PlaylistRepository playlistRepository;
    private final UserRepository userRepository;

    public PlaylistFollowService(PlaylistFollowRepository followRepository, PlaylistRepository playlistRepository, UserRepository userRepository) {
        this.followRepository = followRepository;
        this.playlistRepository = playlistRepository;
        this.userRepository = userRepository;
    }

    public void followPlaylist(Long playlistId, String username) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist no encontrada con ID: " + playlistId));
        if (!playlist.isPublic()) throw new IllegalArgumentException("Solo puedes seguir playlists públicas");
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        if (followRepository.findByUserAndPlaylist(user, playlist).isPresent()) {
            throw new IllegalArgumentException("Ya sigues esta playlist");
        }
        PlaylistFollow follow = new PlaylistFollow();
        follow.setUser(user);
        follow.setPlaylist(playlist);
        followRepository.save(follow);
    }

    public void unfollowPlaylist(Long playlistId, String username) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist no encontrada con ID: " + playlistId));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        followRepository.deleteByUserAndPlaylist(user, playlist);
    }

    public List<PlaylistFollow> getFollowedPlaylists(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        return followRepository.findByUser(user);
    }

    public void setFavorite(Long playlistId, String username, boolean favorite) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist no encontrada con ID: " + playlistId));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        PlaylistFollow follow = followRepository.findByUserAndPlaylist(user, playlist)
                .orElseThrow(() -> new ResourceNotFoundException("No sigues esta playlist"));
        follow.setFavorite(favorite);
        followRepository.save(follow);
    }
}
