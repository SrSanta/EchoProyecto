package com.echo.echobackend.service;

import com.echo.echobackend.exception.ResourceNotFoundException;
import com.echo.echobackend.model.PlaybackHistory;
import com.echo.echobackend.model.Song;
import com.echo.echobackend.model.User;
import com.echo.echobackend.repository.PlaybackHistoryRepository;
import com.echo.echobackend.repository.SongRepository;
import com.echo.echobackend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PlaybackHistoryService {

    private final PlaybackHistoryRepository playbackHistoryRepository;
    private final UserRepository userRepository;
    private final SongRepository songRepository;

    public PlaybackHistoryService(PlaybackHistoryRepository playbackHistoryRepository,
                                  UserRepository userRepository,
                                  SongRepository songRepository) {
        this.playbackHistoryRepository = playbackHistoryRepository;
        this.userRepository = userRepository;
        this.songRepository = songRepository;
    }

    public void recordPlayback(String username, Long songId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));

        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Canción no encontrada: " + songId));

        PlaybackHistory playback = new PlaybackHistory();
        playback.setUser(user);
        playback.setSong(song);
        playback.setPlaybackTimestamp(LocalDateTime.now());

        playbackHistoryRepository.save(playback);
    }

    public List<PlaybackHistory> getUserPlaybackHistory(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        return playbackHistoryRepository.findByUserOrderByPlaybackTimestampDesc(user);
    }
}
