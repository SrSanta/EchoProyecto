package com.echo.echobackend.service;

import com.echo.echobackend.model.Like;
import com.echo.echobackend.model.User;
import com.echo.echobackend.model.Song;
import com.echo.echobackend.repository.LikeRepository;
import com.echo.echobackend.repository.UserRepository; // Necesario para obtener el User
import com.echo.echobackend.repository.SongRepository;   // Necesario para obtener la Song
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LikeService {

    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final SongRepository songRepository;

    @Autowired
    public LikeService(LikeRepository likeRepository, UserRepository userRepository, SongRepository songRepository) {
        this.likeRepository = likeRepository;
        this.userRepository = userRepository;
        this.songRepository = songRepository;
    }

    @Transactional
    public boolean likeSong(Long userId, Long songId) {
        if (likeRepository.existsByUser_IdAndSong_Id(userId, songId)) {
            return false; // El usuario ya dio like a esta canción
        }

        Optional<User> userOptional = userRepository.findById(userId);
        Optional<Song> songOptional = songRepository.findById(songId);

        if (userOptional.isPresent() && songOptional.isPresent()) {
            Like like = new Like();
            like.setUser(userOptional.get());
            like.setSong(songOptional.get());
            like.setLikeTimestamp(LocalDateTime.now());
            likeRepository.save(like);
            return true;
        }
        return false; // Usuario o canción no encontrados
    }

    @Transactional
    public boolean unlikeSong(Long userId, Long songId) {
        if (likeRepository.existsByUser_IdAndSong_Id(userId, songId)) {
            likeRepository.deleteByUser_IdAndSong_Id(userId, songId);
            return true;
        }
        return false; // El usuario no ha dado like a esta canción
    }

    public long getLikeCountForSong(Long songId) {
        return likeRepository.countBySong_Id(songId);
    }

    public boolean isSongLikedByUser(Long userId, Long songId) {
        return likeRepository.existsByUser_IdAndSong_Id(userId, songId);
    }

    public List<Like> getLikedSongsByUser(Long userId) {
        return likeRepository.findByUser_Id(userId);
    }
}