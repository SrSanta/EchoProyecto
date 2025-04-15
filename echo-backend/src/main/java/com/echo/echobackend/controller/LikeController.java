package com.echo.echobackend.controller;

import com.echo.echobackend.model.Like;
import com.echo.echobackend.service.LikeService;
import com.echo.echobackend.service.UserService; // Necesitas inyectar UserService
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/likes")
public class LikeController {

    private final LikeService likeService;
    private final UserService userService; // Inyecta UserService

    @Autowired
    public LikeController(LikeService likeService, UserService userService) {
        this.likeService = likeService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<?> likeSong(@RequestParam("songId") Long songId, @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails.getUsername();
        return userService.findByUsername(username)
                .map(user -> {
                    if (likeService.likeSong(user.getId(), songId)) {
                        return new ResponseEntity<>(HttpStatus.CREATED);
                    } else {
                        return new ResponseEntity<>("Ya has dado like a esta canción o la canción no existe", HttpStatus.BAD_REQUEST);
                    }
                })
                .orElse(new ResponseEntity<>(HttpStatus.UNAUTHORIZED)); // Si no se encuentra el usuario
    }

    @DeleteMapping
    public ResponseEntity<?> unlikeSong(@RequestParam("songId") Long songId, @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails.getUsername();
        return userService.findByUsername(username)
                .map(user -> {
                    if (likeService.unlikeSong(user.getId(), songId)) {
                        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
                    } else {
                        return new ResponseEntity<>("No has dado like a esta canción o la canción no existe", HttpStatus.NOT_FOUND);
                    }
                })
                .orElse(new ResponseEntity<>(HttpStatus.UNAUTHORIZED)); // Si no se encuentra el usuario
    }

    @GetMapping("/songs/{songId}/count")
    public ResponseEntity<Long> getLikeCount(@PathVariable Long songId) {
        return ResponseEntity.ok(likeService.getLikeCountForSong(songId));
    }

    @GetMapping("/users/me")
    public ResponseEntity<List<Long>> getLikedSongIds(@AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails.getUsername();
        return userService.findByUsername(username)
                .map(user -> {
                    List<Like> likes = likeService.getLikedSongsByUser(user.getId());
                    List<Long> likedSongIds = likes.stream()
                            .map(like -> like.getSong().getId())
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(likedSongIds);
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }
}