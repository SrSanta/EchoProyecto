package com.echo.echobackend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlaybackHistoryDTO {

    @NotNull(message = "User ID cannot be null")
    private Long userId;

    @NotNull(message = "Song ID cannot be null")
    private Long songId;

    private Long playbackTimestamp;
}
