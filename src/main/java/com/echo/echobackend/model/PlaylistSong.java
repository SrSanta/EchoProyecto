package com.echo.echobackend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Entity
@Table(name = "playlist_songs")
@IdClass(PlaylistSongId.class)
@Data
@NoArgsConstructor
public class PlaylistSong {

    @Id
    @ManyToOne
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;

    @Id
    @ManyToOne
    @JoinColumn(name = "song_id", nullable = false)
    private Song song;

    @Column(name = "song_order") // Renombrar la columna
    private Integer songOrder;
}