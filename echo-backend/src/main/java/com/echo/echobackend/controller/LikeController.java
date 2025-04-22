package com.echo.echobackend.controller;

import com.echo.echobackend.model.Like;
import com.echo.echobackend.service.LikeService;
import com.echo.echobackend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/likes")
public class LikeController {

    private final LikeService likeService;
    private final UserService userService;

    public LikeController(LikeService likeService, UserService userService) {
        this.likeService = likeService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<?> likeSong(@RequestBody Map<String, Long> payload, @AuthenticationPrincipal UserDetails userDetails) {
        Long songId = payload.get("songId");
        if (songId == null) {
             return new ResponseEntity<>("songId is required in the request body", HttpStatus.BAD_REQUEST);
        }
        if (userDetails == null) {
             return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        String username = userDetails.getUsername();
        return userService.findByUsername(username)
                .map(user -> {
                    if (likeService.likeSong(user.getId(), songId)) {
                        return new ResponseEntity<>(HttpStatus.CREATED);
                    } else {
                        return new ResponseEntity<>("Ya has dado like a esta canción o la canción no existe", HttpStatus.BAD_REQUEST);
                    }
                })
                .orElse(new ResponseEntity<>(HttpStatus.UNAUTHORIZED));
    }

    // --- MODIFICADO ---
    @DeleteMapping("/{songId}")
    public ResponseEntity<?> unlikeSong(@PathVariable Long songId, @AuthenticationPrincipal UserDetails userDetails) {
         if (userDetails == null) {
             return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        String username = userDetails.getUsername();
        return userService.findByUsername(username)
                .map(user -> {
                    if (likeService.unlikeSong(user.getId(), songId)) {
                        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
                    } else {
                        return new ResponseEntity<>("No has dado like a esta canción o la canción no existe", HttpStatus.NOT_FOUND);
                    }
                })
                .orElse(new ResponseEntity<>(HttpStatus.UNAUTHORIZED));
    }

    @GetMapping("/songs/{songId}/liked")
    public ResponseEntity<Boolean> isSongLikedByUser(@PathVariable Long songId, @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.ok(false);
        }
        String username = userDetails.getUsername();
        return userService.findByUsername(username)
                .map(user -> ResponseEntity.ok(likeService.isSongLikedByUser(user.getId(), songId)))
                .orElse(ResponseEntity.ok(false));
    }


    @GetMapping("/songs/{songId}/count")
    public ResponseEntity<Long> getLikeCount(@PathVariable Long songId) {
        return ResponseEntity.ok(likeService.getLikeCountForSong(songId));
    }

    @GetMapping("/users/me")
    public ResponseEntity<List<Long>> getLikedSongIds(@AuthenticationPrincipal UserDetails userDetails) {
         if (userDetails == null) {
             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
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
