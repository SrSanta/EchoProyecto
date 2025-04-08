package com.echo.echobackend.repository;

import com.echo.echobackend.model.PlaybackHistory;
import com.echo.echobackend.model.PlaybackHistoryId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlaybackHistoryRepository extends JpaRepository<PlaybackHistory, PlaybackHistoryId> {
    // Métodos para buscar el historial de un usuario, etc.
}