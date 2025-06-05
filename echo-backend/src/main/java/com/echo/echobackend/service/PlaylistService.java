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
import java.util.stream.Collectors;

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
        // Validación de nombre
        if (playlist.getName() == null || playlist.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la playlist no puede estar vacío");
        }
        // Verifica duplicados para el usuario
        List<Playlist> userPlaylists = playlistRepository.findByUser(user);
        if (userPlaylists.stream().anyMatch(p -> p.getName().equalsIgnoreCase(playlist.getName().trim()))) {
            throw new IllegalArgumentException("Ya existe una playlist con ese nombre para el usuario");
        }
        playlist.setUser(user);
        playlist.setCreationDate(LocalDateTime.now());
        if (playlist.getName() != null) playlist.setName(playlist.getName().trim());
        // Si no se especifica, por defecto es privada
        if (playlist.isPublic() == false) playlist.setPublic(false);
        logger.info("Usuario {} creó una nueva playlist: {}", username, playlist.getName());
        return playlistRepository.save(playlist);
    }

    public List<Playlist> getPlaylistsByUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        return playlistRepository.findByUser(user);
    }

    // Nuevo método para obtener playlists públicas por usuario
    public List<Playlist> getPublicPlaylistsByUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        return playlistRepository.findByUserAndIsPublicTrue(user);
    }

    public List<Playlist> getAllPublicPlaylists() {
        return playlistRepository.findByIsPublicTrue();
    }
    
    public List<Playlist> searchPlaylists(String name) {
        // Permitir búsqueda con cualquier término no vacío
        if (name == null || name.trim().isEmpty()) {
             // Opcional: Manejar aquí si se desea devolver un resultado específico para búsqueda vacía
             // Por ahora, devolvemos una lista vacía si el término es nulo o vacío
             return List.of(); // Devuelve lista vacía para búsqueda vacía
        }
        return playlistRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Playlist> getAllPlaylists() {
        return playlistRepository.findAll();
    }

    public Playlist getPlaylistById(Long id) {
        return playlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist no encontrada con ID: " + id));
    }

    public Playlist updatePlaylist(Long id, Playlist playlistDetails, String username) {
        Playlist playlist = validatePlaylistOwnership(id, username);
        // Validación de nombre
        if (playlistDetails.getName() == null || playlistDetails.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la playlist no puede estar vacío");
        }
        // Verifica duplicados para el usuario (excluyendo la actual)
        List<Playlist> userPlaylists = playlistRepository.findByUser(playlist.getUser());
        if (userPlaylists.stream().anyMatch(p -> !p.getId().equals(id) && p.getName().equalsIgnoreCase(playlistDetails.getName().trim()))) {
            throw new IllegalArgumentException("Ya existe otra playlist con ese nombre para el usuario");
        }
        playlist.setName(playlistDetails.getName().trim());
        // Actualiza visibilidad pública
        playlist.setPublic(playlistDetails.isPublic());
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

        // 1. Obtener todas las relaciones PlaylistSong para esta playlist una sola vez
        List<PlaylistSong> playlistSongs = playlistSongRepository.findByPlaylist(playlist);

        // 2. Crear un mapa para acceder rápidamente a PlaylistSong por songId
        java.util.Map<Long, PlaylistSong> playlistSongMap = playlistSongs.stream()
                .collect(Collectors.toMap(ps -> ps.getSong().getId(), ps -> ps));

        // 3. Iterar sobre la lista de IDs y actualizar el orden
        int order = 1;
        for (Long songId : songIds) {
            PlaylistSong ps = playlistSongMap.get(songId);
            if (ps != null) {
                ps.setSongOrder(order++);
            } else {
                // Opcional: manejar caso donde un songId en la lista proporcionada no está en la playlist
                logger.warn("Canción con ID {} no encontrada en la playlist {} durante reordenamiento", songId, playlistId);
                // Podríamos lanzar una excepción o simplemente ignorarlo, dependiendo del requisito
                // throw new IllegalArgumentException("La canción con ID " + songId + " no está en la playlist.");
            }
        }

        // JPA persistirá los cambios automáticamente al final de la transacción
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
