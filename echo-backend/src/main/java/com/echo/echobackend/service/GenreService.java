package com.echo.echobackend.service;

import com.echo.echobackend.model.Genre;
import com.echo.echobackend.repository.GenreRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GenreService {

    private final GenreRepository genreRepository;

    public GenreService(GenreRepository genreRepository) {
        this.genreRepository = genreRepository;
    }

    public Optional<Genre> findByName(String name) {
        return genreRepository.findByName(name);
    }

    public Genre saveGenre(Genre genre) {
        return genreRepository.save(genre);
    }

    public List<Genre> findAll() {
        return genreRepository.findAll();
    }

    public Optional<Genre> findById(Long id) {
        return genreRepository.findById(id);
    }

    public Genre updateGenre(Long id, Genre genreDetails) {
        return genreRepository.findById(id).map(genre -> {
            genre.setName(genreDetails.getName());
            return genreRepository.save(genre);
        }).orElseThrow(() -> new RuntimeException("Género no encontrado"));
    }

    public void deleteById(Long id) {
        genreRepository.deleteById(id);
    }

    public boolean existsByName(String name) {
        return genreRepository.findByName(name).isPresent();
    }
}