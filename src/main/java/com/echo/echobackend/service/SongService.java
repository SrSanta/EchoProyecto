package com.echo.echobackend.service;

import com.echo.echobackend.model.Role;
import com.echo.echobackend.model.Song;
import com.echo.echobackend.model.User;
import com.echo.echobackend.repository.RoleRepository;
import com.echo.echobackend.repository.SongRepository;
import com.echo.echobackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SongService {

    private final SongRepository songRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Autowired
    public SongService(SongRepository songRepository, UserRepository userRepository, RoleRepository roleRepository) {
        this.songRepository = songRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    public Song saveSong(Song song, Long userId) {
        // Obtener al usuario que sube la canción
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar si es la primera canción del usuario
        boolean isFirstSong = user.getSongs().isEmpty();  // Si la lista de canciones del usuario está vacía

        // Si es la primera canción, asignar el rol de ARTISTA
        if (isFirstSong) {
            Role artistRole = roleRepository.findByName("ROLE_ARTIST")
                    .orElseThrow(() -> new RuntimeException("Rol ARTISTA no encontrado"));

            user.getRoles().add(artistRole);  // Agregar el rol de ARTISTA al usuario
            userRepository.save(user);  // Guardar los cambios del usuario
        }

        // Establecer el perfil del usuario como público (si es necesario)
        user.setProfilePublic(true);

        // Establecer la fecha de carga de la canción
        song.setUploadDate(LocalDateTime.now());
        song.setUser(user); // Asociar la canción con el usuario/artista

        // Guardar la canción
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
            song.setUser(songDetails.getUser());
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
        return songRepository.findByUserUsernameContainingIgnoreCase(artist);
    }

    public List<Song> findByTitle(String title) {
        return songRepository.findByTitleContainingIgnoreCase(title);
    }
}