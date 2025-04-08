package com.echo.echobackend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "songs")
@Data
@NoArgsConstructor
public class Song {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String artist;

    @ManyToOne
    @JoinColumn(name = "genre_id", nullable = false)
    private Genre genre;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String audioFilename;
    private String videoFilename;
    private String thumbnailFilename;
    private String album;
    private Integer releaseYear;

    @Column(columnDefinition = "TEXT")
    private String tags;

    private LocalDateTime uploadDate;
    private LocalDateTime publishDate;
}