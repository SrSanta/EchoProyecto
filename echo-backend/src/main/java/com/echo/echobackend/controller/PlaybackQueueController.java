package com.echo.echobackend.controller;

import com.echo.echobackend.model.PlaybackQueue;
import com.echo.echobackend.service.PlaybackQueueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/queue")
public class PlaybackQueueController {
    private final PlaybackQueueService playbackQueueService;

    public PlaybackQueueController(PlaybackQueueService playbackQueueService) {
        this.playbackQueueService = playbackQueueService;
    }

    @GetMapping("/{username}")
    public ResponseEntity<List<PlaybackQueue>> getQueue(@PathVariable String username) {
        return ResponseEntity.ok(playbackQueueService.getQueue(username));
    }

    @PostMapping("/add")
    public ResponseEntity<Void> addSongToQueue(@RequestParam String username, @RequestParam Long songId) {
        playbackQueueService.addSongToQueue(username, songId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/remove")
    public ResponseEntity<Void> removeSongFromQueue(@RequestParam String username, @RequestParam Long songId) {
        playbackQueueService.removeSongFromQueue(username, songId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/reorder")
    public ResponseEntity<Void> reorderQueue(@RequestParam String username, @RequestBody List<Long> songIds) {
        playbackQueueService.reorderQueue(username, songIds);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearQueue(@RequestParam String username) {
        playbackQueueService.clearQueue(username);
        return ResponseEntity.ok().build();
    }
}
