package com.echo.echobackend.controller;

import com.echo.echobackend.model.PlaylistFollow;
import com.echo.echobackend.service.PlaylistFollowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/playlist-follows")
public class PlaylistFollowController {
    private final PlaylistFollowService followService;

    public PlaylistFollowController(PlaylistFollowService followService) {
        this.followService = followService;
    }

    @PostMapping("/follow/{playlistId}")
    public ResponseEntity<Void> followPlaylist(@PathVariable Long playlistId, Principal principal) {
        followService.followPlaylist(playlistId, principal.getName());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/unfollow/{playlistId}")
    public ResponseEntity<Void> unfollowPlaylist(@PathVariable Long playlistId, Principal principal) {
        followService.unfollowPlaylist(playlistId, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("")
    public ResponseEntity<List<PlaylistFollow>> getFollowedPlaylists(Principal principal) {
        List<PlaylistFollow> follows = followService.getFollowedPlaylists(principal.getName());
        return ResponseEntity.ok(follows);
    }

    @PostMapping("/favorite/{playlistId}")
    public ResponseEntity<Void> setFavorite(@PathVariable Long playlistId, @RequestParam boolean favorite, Principal principal) {
        followService.setFavorite(playlistId, principal.getName(), favorite);
        return ResponseEntity.ok().build();
    }
}
