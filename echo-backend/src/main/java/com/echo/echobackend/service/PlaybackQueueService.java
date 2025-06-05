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
import java.util.stream.Collectors;

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

        // 1. Obtener todos los items de la cola para este usuario una sola vez
        List<PlaybackQueue> queue = playbackQueueRepository.findByUserOrderBySongOrderAsc(user);

        // Validar que el número de canciones proporcionado coincide con el tamaño actual de la cola
        if (queue.size() != songIds.size()) {
            // Podríamos ser más específicos aquí, indicando qué canciones faltan o sobran
            throw new IllegalArgumentException("El número de canciones proporcionado no coincide con el tamaño actual de la cola.");
        }

        // 2. Crear un mapa para acceder rápidamente a PlaybackQueue por songId
        java.util.Map<Long, PlaybackQueue> queueItemMap = queue.stream()
                .collect(Collectors.toMap(item -> item.getSong().getId(), item -> item));

        // 3. Iterar sobre la lista de IDs proporcionada y actualizar el orden
        int order = 1;
        for (Long songId : songIds) {
            PlaybackQueue item = queueItemMap.get(songId);
            // Dado que ya validamos que los tamaños coinciden, cada songId debería estar en el mapa
            // Pero un check nulo defensivo no hace daño.
            if (item != null) {
                 item.setSongOrder(order++);
            } else {
                // Esto no debería ocurrir si la validación de tamaño es correcta,
                // pero si ocurriera, significa que un songId proporcionado no existe en la cola del usuario.
                 throw new ResourceNotFoundException("Canción con ID " + songId + " no encontrada en la cola del usuario.");
            }
        }

        // JPA persistirá los cambios automáticamente al final de la transacción
    }

    @Transactional
    public void clearQueue(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        playbackQueueRepository.deleteByUser(user);
    }
}
