package com.echo.echobackend.service;

import com.echo.echobackend.exception.ResourceNotFoundException;
import com.echo.echobackend.exception.UnauthorizedAccessException;
import com.echo.echobackend.model.Playlist;
import com.echo.echobackend.model.PlaylistSong;
import com.echo.echobackend.model.Song;
import com.echo.echobackend.model.User;
import com.echo.echobackend.repository.PlaylistRepository;
import com.echo.echobackend.repository.PlaylistSongRepository;
import com.echo.echobackend.repository.SongRepository;
import com.echo.echobackend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PlaylistService {

    private static final Logger logger = LoggerFactory.getLogger(PlaylistService.class);

    private final PlaylistRepository playlistRepository;
    private final PlaylistSongRepository playlistSongRepository;
    private final UserRepository userRepository;
    private final SongRepository songRepository;

    public PlaylistService(PlaylistRepository playlistRepository, PlaylistSongRepository playlistSongRepository, UserRepository userRepository, SongRepository songRepository) {
        this.playlistRepository = playlistRepository;
        this.playlistSongRepository = playlistSongRepository;
        this.userRepository = userRepository;
        this.songRepository = songRepository;
    }

    public Playlist createPlaylist(Playlist playlist, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        playlist.setUser(user);
        playlist.setCreationDate(LocalDateTime.now());
        logger.info("Usuario {} creó una nueva playlist: {}", username, playlist.getName());
        return playlistRepository.save(playlist);
    }

    public List<Playlist> getPlaylistsByUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        return playlistRepository.findByUser(user);
    }

    public Playlist getPlaylistById(Long id) {
        return playlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist no encontrada con ID: " + id));
    }

    public Playlist updatePlaylist(Long id, Playlist playlistDetails, String username) {
        Playlist playlist = validatePlaylistOwnership(id, username);
        playlist.setName(playlistDetails.getName());
        logger.info("Usuario {} actualizó la playlist: {}", username, playlist.getName());
        return playlistRepository.save(playlist);
    }

    @Transactional
    public void deletePlaylist(Long id, String username) {
        playlistSongRepository.deleteByPlaylistId(id);
        playlistRepository.deleteById(id);
        logger.info("Usuario {} eliminó la playlist con ID: {}", username, id);
    }

    @Transactional
    public void addSongToPlaylist(Long playlistId, Long songId, String username, Integer songOrder) {
        Playlist playlist = validatePlaylistOwnership(playlistId, username);
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Canción no encontrada con ID: " + songId));

        if (playlistSongRepository.existsByPlaylistAndSong(playlist, song)) {
            throw new IllegalArgumentException("La canción ya está en la playlist");
        }

        PlaylistSong playlistSong = new PlaylistSong();
        playlistSong.setPlaylist(playlist);
        playlistSong.setSong(song);

        if (songOrder == null) {
            songOrder = playlistSongRepository.findMaxOrderByPlaylist(playlist).orElse(0) + 1;
        }
        playlistSong.setSongOrder(songOrder);

        playlistSongRepository.save(playlistSong);
        logger.info("Canción {} agregada a la playlist {} por {}", song.getTitle(), playlist.getName(), username);
    }

    @Transactional
    public void removeSongFromPlaylist(Long playlistId, Long songId, String username) {
        Playlist playlist = validatePlaylistOwnership(playlistId, username);
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Canción no encontrada con ID: " + songId));

        PlaylistSong playlistSong = (PlaylistSong) playlistSongRepository.findByPlaylistAndSong(playlist, song)
                .orElseThrow(() -> new ResourceNotFoundException("La canción no está en esta playlist"));

        playlistSongRepository.delete(playlistSong);
        logger.info("Usuario {} eliminó la canción {} de la playlist {}", username, song.getTitle(), playlist.getName());
    }

    public List<PlaylistSong> getSongsFromPlaylist(Long playlistId, String username) {
        Playlist playlist = validatePlaylistOwnership(playlistId, username);
        return playlistSongRepository.findByPlaylist(playlist);
    }

    @Transactional
    public void reorderSongs(Long playlistId, List<Long> songIds, String username) {
        Playlist playlist = validatePlaylistOwnership(playlistId, username);
        int order = 1;
        for (Long songId : songIds) {
            Song song = songRepository.findById(songId)
                    .orElseThrow(() -> new ResourceNotFoundException("Canción no encontrada con ID: " + songId));
            PlaylistSong ps = (PlaylistSong) playlistSongRepository.findByPlaylistAndSong(playlist, song)
                    .orElseThrow(() -> new ResourceNotFoundException("La canción no está en la playlist"));
            ps.setSongOrder(order++);
            playlistSongRepository.save(ps);
        }
        logger.info("Usuario {} reordenó las canciones de la playlist {}", username, playlist.getName());
    }

    private Playlist validatePlaylistOwnership(Long playlistId, String username) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist no encontrada con ID: " + playlistId));
        if (!playlist.getUser().getUsername().equals(username)) {
            throw new UnauthorizedAccessException("No tienes permiso para acceder a esta playlist");
        }
        return playlist;
    }
}
