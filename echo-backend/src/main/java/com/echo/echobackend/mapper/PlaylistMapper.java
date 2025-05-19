package com.echo.echobackend.mapper;

import com.echo.echobackend.dto.PlaylistDTO;
import com.echo.echobackend.dto.PlaylistWithFollowDTO;
import com.echo.echobackend.dto.SongDTO;
import com.echo.echobackend.model.Playlist;
import com.echo.echobackend.model.PlaylistSong;
import com.echo.echobackend.model.Song;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PlaylistMapper {
    public PlaylistWithFollowDTO toWithFollowDto(Playlist playlist, boolean followed, boolean favorite) {
        PlaylistWithFollowDTO dto = new PlaylistWithFollowDTO();
        dto.setId(playlist.getId());
        dto.setName(playlist.getName());
        dto.setUserId(playlist.getUser() != null ? playlist.getUser().getId() : null);
        dto.setIsPublic(playlist.getIsPublic());
        dto.setFollowed(followed);
        dto.setFavorite(favorite);
        if (playlist.getPlaylistSongs() != null) {
            List<SongDTO> songDTOs = playlist.getPlaylistSongs().stream()
                    .map(PlaylistSong::getSong)
                    .map(this::toSongDto)
                    .collect(Collectors.toList());
            dto.setSongs(songDTOs);
        }
        return dto;
    }
    public PlaylistDTO toDto(Playlist playlist) {
        PlaylistDTO dto = new PlaylistDTO();
        dto.setId(playlist.getId());
        dto.setName(playlist.getName());
        dto.setUserId(playlist.getUser() != null ? playlist.getUser().getId() : null);
        if (playlist.getPlaylistSongs() != null) {
            List<SongDTO> songDTOs = playlist.getPlaylistSongs().stream()
                    .map(PlaylistSong::getSong)
                    .map(this::toSongDto)
                    .collect(Collectors.toList());
            dto.setSongs(songDTOs);
        }
        return dto;
    }

    public SongDTO toSongDto(Song song) {
        SongDTO dto = new SongDTO();
        dto.setId(song.getId());
        dto.setTitle(song.getTitle());
        dto.setArtist(song.getUser() != null ? song.getUser().getUsername() : null);
        dto.setGenre(song.getGenre() != null ? song.getGenre().getName() : null);
        dto.setAlbum(song.getAlbum());
        dto.setReleaseYear(song.getReleaseYear() != null ? song.getReleaseYear() : 0);
        // Convierte tags de String a List<String> si es necesario
        if (song.getTags() != null && !song.getTags().isEmpty()) {
            dto.setTags(java.util.Arrays.asList(song.getTags().split(",")));
        } else {
            dto.setTags(java.util.Collections.emptyList());
        }
        return dto;
    }

    public List<PlaylistDTO> toDtoList(List<Playlist> playlists) {
        return playlists.stream().map(this::toDto).collect(Collectors.toList());
    }
}
