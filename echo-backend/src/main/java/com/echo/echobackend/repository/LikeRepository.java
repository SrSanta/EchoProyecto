package com.echo.echobackend.repository;

import com.echo.echobackend.model.Like;
import com.echo.echobackend.model.LikeId;
import com.echo.echobackend.model.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LikeRepository extends JpaRepository<Like, LikeId> {
    long countBySong_Id(Long songId);
    boolean existsByUser_IdAndSong_Id(Long userId, Long songId);
    List<Like> findByUser_Id(Long userId);
    void deleteByUser_IdAndSong_Id(Long userId, Long songId);
    void deleteBySong(Song song);
}