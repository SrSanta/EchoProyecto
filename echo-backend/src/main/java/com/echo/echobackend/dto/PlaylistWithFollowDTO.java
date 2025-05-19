package com.echo.echobackend.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class PlaylistWithFollowDTO {
    private Long id;
    private String name;
    private boolean isPublic;
    private Long userId;
    private boolean followed;
    private boolean favorite;
    private List<SongDTO> songs;
    public void setIsPublic(boolean isPublic) { this.isPublic = isPublic; }
    public boolean getIsPublic() { return isPublic; }
}
