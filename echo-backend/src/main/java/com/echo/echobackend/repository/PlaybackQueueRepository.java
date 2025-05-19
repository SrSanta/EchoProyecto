package com.echo.echobackend.repository;

import com.echo.echobackend.model.PlaybackQueue;
import com.echo.echobackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaybackQueueRepository extends JpaRepository<PlaybackQueue, Long> {
    List<PlaybackQueue> findByUserOrderBySongOrderAsc(User user);
    void deleteByUser(User user);
    void deleteByUserAndSong(User user, com.echo.echobackend.model.Song song);
    @Query("SELECT MAX(q.songOrder) FROM PlaybackQueue q WHERE q.user = :user")
    Integer findMaxOrderByUser(@Param("user") User user);
}
