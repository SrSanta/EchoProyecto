package com.echo.echobackend.model;

import jakarta.persistence.Embeddable;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.io.Serializable;

@Embeddable
@Data
@EqualsAndHashCode
public class PlaylistSongId implements Serializable {
    private Long playlist;
    private Long song;
}