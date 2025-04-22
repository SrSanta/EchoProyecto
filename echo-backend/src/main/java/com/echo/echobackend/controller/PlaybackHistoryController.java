package com.echo.echobackend.controller;

import com.echo.echobackend.model.PlaybackHistory;
import com.echo.echobackend.service.PlaybackHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
public class PlaybackHistoryController {

    private final PlaybackHistoryService playbackHistoryService;

    public PlaybackHistoryController(PlaybackHistoryService playbackHistoryService) {
        this.playbackHistoryService = playbackHistoryService;
    }

    @PostMapping("/record")
    public ResponseEntity<Void> recordPlayback(@RequestParam String username,
                                               @RequestParam Long songId) {
        playbackHistoryService.recordPlayback(username, songId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{username}")
    public ResponseEntity<List<PlaybackHistory>> getUserHistory(@PathVariable String username) {
        List<PlaybackHistory> history = playbackHistoryService.getUserPlaybackHistory(username);
        return ResponseEntity.ok(history);
    }
}
