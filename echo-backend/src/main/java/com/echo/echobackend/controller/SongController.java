package com.echo.echobackend.controller;

import com.echo.echobackend.config.FileStorageProperties;
import com.echo.echobackend.exception.SongNotFoundException;
import com.echo.echobackend.model.Song;
import com.echo.echobackend.model.User;
import com.echo.echobackend.service.SongService;
import com.echo.echobackend.service.UserService;
import com.echo.echobackend.repository.UserRepository;
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
import org.springframework.beans.factory.annotation.Autowired;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class SongController {

    private final SongService songService;
    private final FileStorageProperties fileStorageProperties;
    private final UserRepository userRepository;
    private final UserService userService;

    @Autowired
    public SongController(SongService songService, FileStorageProperties fileStorageProperties, UserRepository userRepository, UserService userService) {
        this.songService = songService;
        this.fileStorageProperties = fileStorageProperties;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @PostMapping("/songs/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadSong(@RequestParam("mediaFile") MultipartFile mediaFile,
                                        @RequestParam("title") String title,
                                        @RequestParam("thumbnailFile") MultipartFile thumbnailFile,
                                        @RequestParam("genreId") Long genreId,
                                        @RequestParam(value = "releaseYear", required = false) Integer releaseYear,
                                        @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return new ResponseEntity<>("User not authenticated", HttpStatus.UNAUTHORIZED);
        }
        if (mediaFile.isEmpty()) {
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
            Song savedSong = songService.storeAndSaveSong(mediaFile, thumbnailFile, title, userDetails.getUsername(), genreId, releaseYear);
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
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> deleteSong(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
             // This check might be redundant with @PreAuthorize, but good for clarity
            return new ResponseEntity<String>(HttpStatus.UNAUTHORIZED);
        }

        Optional<User> userOptional = userRepository.findByUsername(userDetails.getUsername());
        if (!userOptional.isPresent()) {
             // User not found in DB despite being authenticated? Should not happen often.
            return new ResponseEntity<String>(HttpStatus.NOT_FOUND);
        }
        User authenticatedUser = userOptional.get();

        try {
            songService.deleteById(id, authenticatedUser);
            return new ResponseEntity<String>(HttpStatus.NO_CONTENT); // Still return NO_CONTENT for success
        } catch (RuntimeException e) {
            // Catch the ownership check exception or SongNotFoundException
            System.err.println("Deletion failed for song " + id + ": " + e.getMessage());
            // Depending on the exception, return 403 Forbidden or 404 Not Found
            if (e.getMessage().contains("No tienes permiso")) {
                 return new ResponseEntity<String>(e.getMessage(), HttpStatus.FORBIDDEN);
            } else if (e.getMessage().contains("Canción no encontrada")) {
                 return new ResponseEntity<String>(e.getMessage(), HttpStatus.NOT_FOUND);
            } else {
                 return new ResponseEntity<String>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (Exception e) {
             // Catch any other unexpected exceptions
             System.err.println("Unexpected error during deletion of song " + id + ": " + e.getMessage());
             return new ResponseEntity<String>("An unexpected error occurred.", HttpStatus.INTERNAL_SERVER_ERROR);
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

    @GetMapping("/thumbnails/{filename:.+}")
    public ResponseEntity<Resource> serveThumbnailFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(fileStorageProperties.getUploadDir()).resolve("thumbnail").resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .body(resource); // No need for Accept-Ranges header for images
            } else {
                System.err.println("Thumbnail file not found or not readable: " + filename);
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException ex) {
             System.err.println("Malformed URL for thumbnail file: " + filename + " - " + ex.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IOException ex) {
             System.err.println("IO Error serving thumbnail file: " + filename + " - " + ex.getMessage());
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/audio/{filename:.+}")
    public ResponseEntity<Resource> serveAudioFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(fileStorageProperties.getUploadDir()).resolve("audio").resolve(filename).normalize();
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

    @GetMapping("/video/{filename:.+}")
    public ResponseEntity<Resource> serveVideoFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(fileStorageProperties.getUploadDir()).resolve("video").resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    // Fallback: Determine based on file extension
                    int lastDot = filename.lastIndexOf('.');
                    if (lastDot > 0) {
                        String fileExtension = filename.substring(lastDot + 1).toLowerCase();
                        switch (fileExtension) {
                            case "mp4": contentType = "video/mp4"; break;
                            case "webm": contentType = "video/webm"; break;
                            // Add other video types as needed
                            default: contentType = "application/octet-stream"; break;
                        }
                    } else {
                         contentType = "application/octet-stream"; // Default fallback if no extension
                    }
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                        .body(resource);
            } else {
                System.err.println("Video file not found or not readable: " + filename);
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException ex) {
            System.err.println("Malformed URL for video file: " + filename + " - " + ex.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IOException ex) {
            System.err.println("IO Error serving video file: " + filename + " - " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/songs/user/{username}")
    public ResponseEntity<List<Song>> getSongsByUsername(@PathVariable String username) {
        Optional<User> userOptional = userService.findByUsername(username);
        if (!userOptional.isPresent()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        User user = userOptional.get();
        List<Song> songs = songService.findByUser(user);
        return ResponseEntity.ok(songs);
    }

    @GetMapping("/songs/user")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Song>> getUserSongs(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        Optional<User> userOptional = userRepository.findByUsername(userDetails.getUsername());
        if (!userOptional.isPresent()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        User user = userOptional.get();
        
        List<Song> userSongs = songService.findByUser(user);
        
        return ResponseEntity.ok(userSongs);
    }
}