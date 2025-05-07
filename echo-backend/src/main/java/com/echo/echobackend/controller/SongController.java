package com.echo.echobackend.controller;

import com.echo.echobackend.config.FileStorageProperties;
import com.echo.echobackend.exception.SongNotFoundException;
import com.echo.echobackend.model.Song;
import com.echo.echobackend.service.SongService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api")
public class SongController {

    private final SongService songService;
    private final FileStorageProperties fileStorageProperties;

    public SongController(SongService songService, FileStorageProperties fileStorageProperties) {
        this.songService = songService;
        this.fileStorageProperties = fileStorageProperties;
    }

    @PostMapping("/songs/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadSong(@RequestParam("file") MultipartFile file,
                                        @RequestParam("title") String title,
                                        @RequestParam("thumbnailFile") MultipartFile thumbnailFile,
                                        @RequestParam(value = "videoFile", required = false) MultipartFile videoFile,
                                        @RequestParam("genreId") Long genreId,
                                        @RequestParam(value = "releaseYear", required = false) Integer releaseYear,
                                        @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return new ResponseEntity<>("User not authenticated", HttpStatus.UNAUTHORIZED);
        }
        if (file.isEmpty()) {
            return new ResponseEntity<>("File is empty", HttpStatus.BAD_REQUEST);
        }
        if (thumbnailFile.isEmpty()) {
            return new ResponseEntity<>("Thumbnail file is empty or not provided", HttpStatus.BAD_REQUEST);
        }
        if (title == null || title.trim().isEmpty()) {
             return new ResponseEntity<>("Title is required", HttpStatus.BAD_REQUEST);
        }
        if (genreId == null) {
             return new ResponseEntity<>("Genre ID is required", HttpStatus.BAD_REQUEST);
        }

        try {
            Song savedSong = songService.storeAndSaveSong(file, thumbnailFile, videoFile, title, userDetails.getUsername(), genreId, releaseYear);
            return new ResponseEntity<>(savedSong, HttpStatus.CREATED);
        } catch (IOException e) {
            System.err.println("Upload failed (IO): " + e.getMessage());
            return new ResponseEntity<>("Could not upload the file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (NoSuchElementException e) {
             System.err.println("Upload failed (Data): " + e.getMessage());
             return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (IllegalArgumentException e) {
             System.err.println("Upload failed (Input): " + e.getMessage());
             return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
             System.err.println("Upload failed (Runtime): " + e.getMessage());
             return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/songs/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Song> updateSongMetadata(@PathVariable Long id, @RequestBody Song songDetails) {
        try {
            Song updatedSong = songService.updateSong(id, songDetails);
            return ResponseEntity.ok(updatedSong);
        } catch (RuntimeException e) {
             System.err.println("Update failed for song " + id + ": " + e.getMessage());
             return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/songs")
    public ResponseEntity<List<Song>> getAllSongs() {
        List<Song> songs = songService.findAll();
        return ResponseEntity.ok(songs);
    }

    @GetMapping("/songs/{id}")
    public ResponseEntity<Song> getSongById(@PathVariable Long id) {
        Song song = songService.findById(id)
                .orElseThrow(() -> new SongNotFoundException(id));
        return ResponseEntity.ok(song);
    }

    @DeleteMapping("/songs/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteSong(@PathVariable Long id) {
        if (songService.findById(id).isPresent()) {
            songService.deleteSong(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/songs/search")
    public ResponseEntity<List<Song>> searchSongs(
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String artist,
            @RequestParam(required = false) String title) {
        try {
            if (title != null && !title.isEmpty()) return ResponseEntity.ok(songService.findByTitle(title));
            if (genre != null && !genre.isEmpty()) return ResponseEntity.ok(songService.findByGenre(genre));
            if (artist != null && !artist.isEmpty()) return ResponseEntity.ok(songService.findByArtist(artist));
        } catch (UnsupportedOperationException e) {
             System.err.println("Search method not implemented: " + e.getMessage());
             return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
        }
        return ResponseEntity.badRequest().body(List.of());
    }

    @GetMapping("/audio/{filename:.+}")
    public ResponseEntity<Resource> serveAudioFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(fileStorageProperties.getUploadDir()).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                        .body(resource);
            } else {
                System.err.println("Audio file not found or not readable: " + filename);
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException ex) {
             System.err.println("Malformed URL for audio file: " + filename + " - " + ex.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IOException ex) {
             System.err.println("IO Error serving audio file: " + filename + " - " + ex.getMessage());
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}