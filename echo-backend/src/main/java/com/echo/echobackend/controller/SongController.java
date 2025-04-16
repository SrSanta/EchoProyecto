package com.echo.echobackend.controller;

import com.echo.echobackend.exception.SongNotFoundException;
import com.echo.echobackend.model.Song;
import com.echo.echobackend.service.SongService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/songs")
public class SongController {

    private final SongService songService;

    @Autowired
    public SongController(SongService songService) {
        this.songService = songService;
    }

    @PostMapping
    public ResponseEntity<Song> uploadSong(@RequestBody Song song, @RequestParam Long userId) {
        Song savedSong = songService.saveSong(song, userId);
        return new ResponseEntity<>(savedSong, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Song>> getAllSongs() {
        List<Song> songs = songService.findAll();
        return ResponseEntity.ok(songs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Song> getSongById(@PathVariable Long id) {
        Song song = songService.findById(id)
                .orElseThrow(() -> new SongNotFoundException(id));
        return ResponseEntity.ok(song);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteSong(@PathVariable Long id) {
        if (songService.findById(id).isPresent()) {
            songService.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER, ROLE_ADMIN')")
    public ResponseEntity<Song> updateSong(@PathVariable Long id, @RequestBody Song song) {
        return ResponseEntity.ok(songService.updateSong(id, song));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Song>> searchSongs(
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String artist,
            @RequestParam(required = false) String title) {

        if (title != null) return ResponseEntity.ok(songService.findByTitle(title));
        if (genre != null) return ResponseEntity.ok(songService.findByGenre(genre));
        if (artist != null) return ResponseEntity.ok(songService.findByArtist(artist));
        return ResponseEntity.badRequest().build();
    }
    // Otros endpoints para actualizar, eliminar canciones, etc.
}