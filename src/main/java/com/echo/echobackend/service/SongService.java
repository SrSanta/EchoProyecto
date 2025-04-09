package com.echo.echobackend.service;

import com.echo.echobackend.model.Song;
import com.echo.echobackend.repository.SongRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SongService {

    private final SongRepository songRepository;

    @Autowired
    public SongService(SongRepository songRepository) {
        this.songRepository = songRepository;
    }

    public Song saveSong(Song song) {
        song.setUploadDate(LocalDateTime.now());
        return songRepository.save(song);
    }

    public Optional<Song> findById(Long id) {
        return songRepository.findById(id);
    }

    public List<Song> findAll() {
        return songRepository.findAll();
    }

    public void deleteSong(Long id) {
        songRepository.deleteById(id);
    }

    public Song updateSong(Long id, Song songDetails) {
        return songRepository.findById(id).map(song -> {
            song.setTitle(songDetails.getTitle());
            song.setArtist(songDetails.getArtist());
            song.setGenre(songDetails.getGenre());
            return songRepository.save(song);
        }).orElseThrow(() -> new RuntimeException("Canción no encontrada"));
    }

    public void deleteById(Long id) {
        songRepository.deleteById(id);
    }

    public List<Song> findByGenre(String genreName) {
        return songRepository.findByGenre_Name(genreName); // Búsqueda EXACTA por nombre de género
    }

    public List<Song> findByArtist(String artist) {
        return songRepository.findByArtistContainingIgnoreCase(artist);
    }

    public List<Song> findByTitle(String title) {
        return songRepository.findByTitleContainingIgnoreCase(title);
    }
}