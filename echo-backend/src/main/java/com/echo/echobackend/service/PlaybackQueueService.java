package com.echo.echobackend.service;

import com.echo.echobackend.exception.ResourceNotFoundException;
import com.echo.echobackend.model.PlaybackQueue;
import com.echo.echobackend.model.Song;
import com.echo.echobackend.model.User;
import com.echo.echobackend.repository.PlaybackQueueRepository;
import com.echo.echobackend.repository.SongRepository;
import com.echo.echobackend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class PlaybackQueueService {
    private final PlaybackQueueRepository playbackQueueRepository;
    private final UserRepository userRepository;
    private final SongRepository songRepository;

    public PlaybackQueueService(PlaybackQueueRepository playbackQueueRepository, UserRepository userRepository, SongRepository songRepository) {
        this.playbackQueueRepository = playbackQueueRepository;
        this.userRepository = userRepository;
        this.songRepository = songRepository;
    }

    public List<PlaybackQueue> getQueue(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        return playbackQueueRepository.findByUserOrderBySongOrderAsc(user);
    }

    @Transactional
    public void addSongToQueue(String username, Long songId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Canción no encontrada: " + songId));
        Integer maxOrder = playbackQueueRepository.findMaxOrderByUser(user);
        int nextOrder = (maxOrder != null ? maxOrder : 0) + 1;
        PlaybackQueue queueItem = new PlaybackQueue();
        queueItem.setUser(user);
        queueItem.setSong(song);
        queueItem.setSongOrder(nextOrder);
        playbackQueueRepository.save(queueItem);
    }

    @Transactional
    public void removeSongFromQueue(String username, Long songId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Canción no encontrada: " + songId));
        playbackQueueRepository.deleteByUserAndSong(user, song);
    }

    @Transactional
    public void reorderQueue(String username, List<Long> songIds) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        List<PlaybackQueue> queue = playbackQueueRepository.findByUserOrderBySongOrderAsc(user);
        if (queue.size() != songIds.size()) {
            throw new IllegalArgumentException("El número de canciones no coincide con la cola actual");
        }
        // Map songId -> PlaybackQueue
        List<PlaybackQueue> reordered = new ArrayList<>();
        for (Long songId : songIds) {
            PlaybackQueue item = queue.stream().filter(q -> q.getSong().getId().equals(songId)).findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Canción no encontrada en la cola: " + songId));
            reordered.add(item);
        }
        int order = 1;
        for (PlaybackQueue item : reordered) {
            item.setSongOrder(order++);
            playbackQueueRepository.save(item);
        }
    }

    @Transactional
    public void clearQueue(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        playbackQueueRepository.deleteByUser(user);
    }
}
