package com.echo.echobackend.service;

import com.echo.echobackend.config.FileStorageProperties;
import com.echo.echobackend.model.Genre;
import com.echo.echobackend.model.Role;
import com.echo.echobackend.model.Song;
import com.echo.echobackend.model.User;
import com.echo.echobackend.repository.GenreRepository;
import com.echo.echobackend.repository.RoleRepository;
import com.echo.echobackend.repository.SongRepository;
import com.echo.echobackend.repository.UserRepository;
import com.echo.echobackend.repository.PlaybackHistoryRepository;
import com.echo.echobackend.repository.PlaylistSongRepository;
import com.echo.echobackend.repository.LikeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import java.util.Set;

@Service
public class SongService {

    private final SongRepository songRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final GenreRepository genreRepository;
    private final PlaybackHistoryRepository playbackHistoryRepository;
    private final PlaylistSongRepository playlistSongRepository;
    private final LikeRepository likeRepository;
    private final Path fileStorageLocation;

    public SongService(SongRepository songRepository,
                       UserRepository userRepository,
                       RoleRepository roleRepository,
                       GenreRepository genreRepository,
                       PlaybackHistoryRepository playbackHistoryRepository,
                       PlaylistSongRepository playlistSongRepository,
                       LikeRepository likeRepository,
                       FileStorageProperties fileStorageProperties) {
        this.songRepository = songRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.genreRepository = genreRepository;
        this.playbackHistoryRepository = playbackHistoryRepository;
        this.playlistSongRepository = playlistSongRepository;
        this.likeRepository = likeRepository;

        String uploadDir = fileStorageProperties.getUploadDir();
        if (uploadDir.trim().isEmpty()) {
            throw new IllegalArgumentException("File upload directory is not configured. Please set 'file.upload-dir' in application properties.");
        }

        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            String errorMsg = "Could not create upload directory: " + this.fileStorageLocation + " - " + ex.getMessage();
            System.err.println(errorMsg);
            throw new RuntimeException(errorMsg, ex);
        }
    }

    private String storeUploadedFile(MultipartFile file, String fileTypePrefix) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        Path typeSpecificDir = this.fileStorageLocation.resolve(fileTypePrefix);

        try {
            Files.createDirectories(typeSpecificDir);
        } catch (IOException ex) {
            System.err.println("Could not create type-specific directory " + typeSpecificDir + ": " + ex.getMessage());
            throw new IOException("Could not create storage directory for type " + fileTypePrefix + ". Please check permissions and path.", ex);
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            try {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            } catch (Exception e) {
                fileExtension = "";
            }
        }

        String uniqueFilenameOnly = UUID.randomUUID().toString() + fileExtension;

        Path targetLocation = typeSpecificDir.resolve(uniqueFilenameOnly);

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            System.err.println("Failed to store file " + uniqueFilenameOnly + " in " + typeSpecificDir + ": " + ex.getMessage());
            throw new IOException("Could not store file " + originalFilename + " as " + targetLocation.toString() + ". Please try again!", ex);
        }
        return fileTypePrefix + "/" + uniqueFilenameOnly;
    }

    private void updateUserRolesAndProfile(User user) {
        boolean isFirstSong = songRepository.countByUser(user) == 0;
        if (isFirstSong) {
            Role artistRole = roleRepository.findByName("ROLE_ARTIST")
                    .orElseThrow(() -> new RuntimeException("Rol ARTISTA no encontrado"));
            if (!user.getRoles().contains(artistRole)) {
                 user.getRoles().add(artistRole);
            }
        }
        if (!user.isProfilePublic()) {
            user.setProfilePublic(true);
        }
    }

    @Transactional
    public Song storeAndSaveSong(MultipartFile mediaFile, MultipartFile thumbnailFile,
                                 String title, String username, Long genreId, Integer releaseYear) throws IOException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        String thumbnailFilename = storeUploadedFile(thumbnailFile, "thumbnail");
        if (thumbnailFilename == null) {
            throw new IllegalArgumentException("Thumbnail file is required.");
        }

        String mediaFilename = null;
        String contentType = mediaFile.getContentType();

        Song newSong = new Song();
        newSong.setTitle(title);
        newSong.setUser(user);
        newSong.setUploadDate(LocalDateTime.now());

        if (genreId != null) {
            Genre genre = genreRepository.findById(genreId)
                    .orElseThrow(() -> new NoSuchElementException("Genre not found with ID: " + genreId));
            newSong.setGenre(genre);
        } else {
             throw new IllegalArgumentException("Genre ID is required but was not provided.");
        }

        if (contentType != null && contentType.startsWith("audio")) {
            mediaFilename = storeUploadedFile(mediaFile, "audio");
            newSong.setAudioFilename(mediaFilename);
            newSong.setVideoFilename(null); // Ensure video filename is null for audio files
        } else if (contentType != null && contentType.startsWith("video")) {
            mediaFilename = storeUploadedFile(mediaFile, "video");
            newSong.setVideoFilename(mediaFilename);
            newSong.setAudioFilename(null); // Ensure audio filename is null for video files
        } else {
            throw new IllegalArgumentException("Unsupported media file type: " + contentType);
        }

        if (mediaFilename == null) {
            throw new IllegalArgumentException("Media file could not be stored.");
        }

        newSong.setThumbnailFilename(thumbnailFilename);
        if (releaseYear != null) {
            newSong.setReleaseYear(releaseYear);
        }
        
        updateUserRolesAndProfile(user); 

        return songRepository.save(newSong);
    }

    public Optional<Song> findById(Long id) {
        return songRepository.findById(id);
    }

    public List<Song> findAll() {
        return songRepository.findAll();
    }

    public Song updateSong(Long id, Song songDetails) {
        return songRepository.findById(id).map(song -> {
            song.setTitle(songDetails.getTitle());
            song.setGenre(songDetails.getGenre());
            return songRepository.save(song);
        }).orElseThrow(() -> new RuntimeException("Canción no encontrada con ID: " + id));
    }

    @Transactional
    public void deleteById(Long id, User authenticatedUser) {
        Song song = songRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Canción no encontrada con ID: " + id));

        // Verificar si el usuario autenticado es un ADMINISTRADOR
        boolean isAdmin = authenticatedUser.getRoles().stream()
                                .anyMatch(role -> role.getName().equals("ROLE_ADMIN"));

        // Si el usuario NO es el propietario de la canción Y NO es administrador, lanzar la excepción
        if (!song.getUser().getId().equals(authenticatedUser.getId()) && !isAdmin) {
            throw new RuntimeException("No tienes permiso para eliminar esta canción.");
        }

        // Si el usuario ES el propietario O ES administrador, procede con la eliminación

        // Optionally delete the files from the file system
        // deleteFile(song.getAudioFilename());
        // deleteFile(song.getThumbnailFilename());
        // deleteFile(song.getVideoFilename());

        // Delete associated playback history records
        playbackHistoryRepository.deleteBySong(song);

        // Delete associated playlist songs records
        playlistSongRepository.deleteBySong(song);

        // Delete associated like records
        likeRepository.deleteBySong(song);

        songRepository.deleteById(id);
    }

    private void deleteFile(String filename) {
        if (filename == null) return;
        Path filePath = this.fileStorageLocation.resolve(filename);
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            System.err.println("Failed to delete file " + filename + ": " + ex.getMessage());
            // Consider logging or throwing a custom exception
        }
    }

    public List<Song> findByGenre(String genreName) {
        return songRepository.findByGenre_Name(genreName);
    }

    public List<Song> findByArtist(String artist) {
        return songRepository.findByUserUsernameContainingIgnoreCase(artist);
    }

    public List<Song> findByTitle(String title) {
        return songRepository.findByTitleContainingIgnoreCase(title);
    }

    public List<Song> findByUser(User user) {
        return songRepository.findByUser(user);
    }
}
