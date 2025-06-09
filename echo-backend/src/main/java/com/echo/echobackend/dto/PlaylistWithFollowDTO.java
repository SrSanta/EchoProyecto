package com.echo.echobackend.dto;

import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@Getter
@Setter
public class PlaylistWithFollowDTO {
    private Long id;
    private String name;
    @JsonProperty("isPublic")
    private boolean isPublic;
    private Long userId;
    private boolean followed;
    private boolean favorite;
    private List<SongDTO> songs;

}
