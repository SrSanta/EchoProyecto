package com.echo.echobackend.controller;

import com.echo.echobackend.model.Song;
import com.echo.echobackend.service.SongService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<Song> uploadSong(@RequestBody Song song) {
        Song savedSong = songService.saveSong(song);
        return new ResponseEntity<>(savedSong, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Song>> getAllSongs() {
        List<Song> songs = songService.findAll();
        return ResponseEntity.ok(songs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSongById(@PathVariable Long id) {
        Optional<Song> song = songService.findById(id);
        return song.map(ResponseEntity::ok)
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSong(@PathVariable Long id) {
        if (songService.findById(id).isPresent()) {
            songService.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Song> updateSong(@PathVariable Long id, @RequestBody Song song) {
        return ResponseEntity.ok(songService.updateSong(id, song));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Song>> searchSongs(
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String artist) {

        if (genre != null) return ResponseEntity.ok(songService.findByGenre(genre));
        if (artist != null) return ResponseEntity.ok(songService.findByArtist(artist));
        return ResponseEntity.badRequest().build();
    }
    // Otros endpoints para actualizar, eliminar canciones, etc.
}