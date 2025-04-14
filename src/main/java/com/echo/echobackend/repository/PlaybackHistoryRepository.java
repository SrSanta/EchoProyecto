package com.echo.echobackend.repository;

import com.echo.echobackend.model.PlaybackHistory;
import com.echo.echobackend.model.PlaybackHistoryId;
import com.echo.echobackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlaybackHistoryRepository extends JpaRepository<PlaybackHistory, PlaybackHistoryId> {
    List<PlaybackHistory> findByUserOrderByPlaybackTimestampDesc(User user);
}
