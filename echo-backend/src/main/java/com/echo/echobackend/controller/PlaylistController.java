package com.echo.echobackend.controller;

import com.echo.echobackend.model.Playlist;
import com.echo.echobackend.model.PlaylistSong;
import com.echo.echobackend.service.PlaylistService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

    private final PlaylistService playlistService;

    public PlaylistController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    @PostMapping
    public ResponseEntity<Playlist> createPlaylist(@RequestBody Playlist playlist,
                                                   @RequestParam String username) {
        Playlist created = playlistService.createPlaylist(playlist, username);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<Playlist>> getPlaylistsByUser(@PathVariable String username) {
        List<Playlist> playlists = playlistService.getPlaylistsByUser(username);
        return ResponseEntity.ok(playlists);
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

    @DeleteMapping("/{playlistId}/songs/{songId}")
    public ResponseEntity<Void> removeSongFromPlaylist(@PathVariable Long playlistId,
                                                       @PathVariable Long songId,
                                                       @RequestParam String username) {
        playlistService.removeSongFromPlaylist(playlistId, songId, username);
        return ResponseEntity.noContent().build();
    }

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
}
