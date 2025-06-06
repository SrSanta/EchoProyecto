package com.echo.echobackend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "playlists")
@Data
@NoArgsConstructor
public class Playlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    private LocalDateTime creationDate;

    @Column(nullable = false)
    private boolean isPublic = false;

    @OneToMany(mappedBy = "playlist")
    @JsonIgnore
    private List<PlaylistSong> playlistSongs;

    @Transient
    public List<Song> getSongs() {
        if (playlistSongs == null) return List.of();
        return playlistSongs.stream()
                .map(PlaylistSong::getSong)
                .toList();
    }

    @JsonProperty("isPublic")
    public boolean isPublic() {
        return isPublic;
    }
}