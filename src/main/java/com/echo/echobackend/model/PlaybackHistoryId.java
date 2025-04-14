package com.echo.echobackend.model;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

@Data
@EqualsAndHashCode
public class PlaybackHistoryId implements Serializable {
    private Long user;
    private Long song;
}
