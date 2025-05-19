package com.echo.echobackend.controller;

import com.echo.echobackend.model.Playlist;
import com.echo.echobackend.model.PlaylistSong;
import com.echo.echobackend.service.PlaylistService;
import com.echo.echobackend.dto.PlaylistDTO;
import com.echo.echobackend.dto.PlaylistWithFollowDTO;
import com.echo.echobackend.service.PlaylistFollowService;
import com.echo.echobackend.mapper.PlaylistMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

    private final PlaylistService playlistService;
    private final PlaylistMapper playlistMapper;
    private final PlaylistFollowService playlistFollowService;

    public PlaylistController(PlaylistService playlistService, PlaylistMapper playlistMapper, PlaylistFollowService playlistFollowService) {
        this.playlistService = playlistService;
        this.playlistMapper = playlistMapper;
        this.playlistFollowService = playlistFollowService;
    }

    @PostMapping
    public ResponseEntity<Playlist> createPlaylist(@RequestBody Playlist playlist,
                                                   @RequestParam String username) {
        Playlist created = playlistService.createPlaylist(playlist, username);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<PlaylistWithFollowDTO>> getPlaylistsByUser(@PathVariable String username, @RequestParam String currentUser) {
        List<Playlist> playlists = playlistService.getPlaylistsByUser(username);
        List<PlaylistWithFollowDTO> dtos = playlists.stream().map(playlist -> {
            boolean followed = false;
            boolean favorite = false;
            try {
                com.echo.echobackend.model.PlaylistFollow follow = playlistFollowService
                    .getFollowedPlaylists(currentUser)
                    .stream()
                    .filter(f -> f.getPlaylist().getId().equals(playlist.getId()))
                    .findFirst().orElse(null);
                if (follow != null) {
                    followed = true;
                    favorite = follow.isFavorite();
                }
            } catch (Exception ignored) {}
            return playlistMapper.toWithFollowDto(playlist, followed, favorite);
        }).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Playlist> getPlaylistById(@PathVariable Long id) {
        Playlist playlist = playlistService.getPlaylistById(id);
        return ResponseEntity.ok(playlist);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Playlist> updatePlaylist(@PathVariable Long id,
                                                   @RequestBody Playlist playlist,
                                                   @RequestParam String username) {
        Playlist updated = playlistService.updatePlaylist(id, playlist, username);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlaylist(@PathVariable Long id,
                                               @RequestParam String username) {
        playlistService.deletePlaylist(id, username);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{playlistId}/songs")
    public ResponseEntity<Void> addSongToPlaylist(@PathVariable Long playlistId,
                                                  @RequestParam Long songId,
                                                  @RequestParam String username,
                                                  @RequestParam(required = false) Integer songOrder) {
        playlistService.addSongToPlaylist(playlistId, songId, username, songOrder);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{playlistId}/songs")
    public ResponseEntity<Void> removeSongFromPlaylist(
            @PathVariable Long playlistId,
            @RequestParam String username,
            @RequestParam Long songId) {
        playlistService.removeSongFromPlaylist(playlistId, songId, username);
        return ResponseEntity.noContent().build();
    }

    // Mantén el método anterior si lo usas en otro lado, pero este es el que espera el frontend.

    @GetMapping("/{playlistId}/songs")
    public ResponseEntity<List<PlaylistSong>> getSongsFromPlaylist(@PathVariable Long playlistId,
                                                                   @RequestParam String username) {
        List<PlaylistSong> songs = playlistService.getSongsFromPlaylist(playlistId, username);
        return ResponseEntity.ok(songs);
    }

    @PutMapping("/{playlistId}/songs/reorder")
    public ResponseEntity<Void> reorderSongs(@PathVariable Long playlistId,
                                             @RequestBody List<Long> songIds,
                                             @RequestParam String username) {
        playlistService.reorderSongs(playlistId, songIds, username);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/share/{playlistId}")
    public ResponseEntity<String> sharePlaylist(@PathVariable Long playlistId) {
        Playlist playlist = playlistService.getPlaylistById(playlistId);
        if (!playlist.getIsPublic()) {
            return ResponseEntity.status(403).body("La playlist no es pública");
        }
        String url = String.format("/api/playlists/public/%d", playlistId);
        return ResponseEntity.ok(url);
    }

    @GetMapping("/public/{playlistId}")
    public ResponseEntity<PlaylistDTO> getPublicPlaylist(@PathVariable Long playlistId) {
        Playlist playlist = playlistService.getPlaylistById(playlistId);
        if (!playlist.getIsPublic()) {
            return ResponseEntity.status(403).build();
        }
        PlaylistDTO dto = playlistMapper.toDto(playlist);
        return ResponseEntity.ok(dto);
    }

    // NUEVO ENDPOINT: Listar todas las públicas
    @GetMapping("/public")
    public ResponseEntity<List<PlaylistDTO>> getAllPublicPlaylists() {
        List<Playlist> publicPlaylists = playlistService.getAllPublicPlaylists();
        List<PlaylistDTO> dtos = publicPlaylists.stream()
            .map(playlistMapper::toDto)
            .toList();
        return ResponseEntity.ok(dtos);
    }
}
