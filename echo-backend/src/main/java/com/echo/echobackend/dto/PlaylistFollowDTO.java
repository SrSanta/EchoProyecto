package com.echo.echobackend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlaylistFollowDTO {
    private Long id;
    private Long userId;
    private Long playlistId;
    private boolean favorite;
}
