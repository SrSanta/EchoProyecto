package com.echo.echobackend.model;

import jakarta.persistence.Embeddable;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.io.Serializable;

@Embeddable
@Data
@EqualsAndHashCode
public class LikeId implements Serializable {
    private Long user;
    private Long song;
}