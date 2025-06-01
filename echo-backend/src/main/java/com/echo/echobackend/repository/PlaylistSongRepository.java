package com.echo.echobackend.repository;

import com.echo.echobackend.model.Playlist;
import com.echo.echobackend.model.PlaylistSong;
import com.echo.echobackend.model.PlaylistSongId;
import com.echo.echobackend.model.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaylistSongRepository extends JpaRepository<PlaylistSong, PlaylistSongId> {
    @Query("SELECT MAX(ps.songOrder) FROM PlaylistSong ps WHERE ps.playlist = :playlist")
    Optional<Integer> findMaxOrderByPlaylist(@Param("playlist") Playlist playlist);

    Optional<Object> findByPlaylistAndSong(Playlist playlist, Song song);

    List<PlaylistSong> findByPlaylist(Playlist playlist);

    boolean existsByPlaylistAndSong(Playlist playlist, Song song);

    void deleteByPlaylistId(Long id);

    void deleteBySong(Song song);
}