package com.echo.echobackend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import java.net.MalformedURLException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.echo.echobackend.config.FileStorageProperties;

@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);

    private final Path fileStorageLocation;

    public FileStorageService(FileStorageProperties fileStorageProperties) {
        // Directorio base configurado en FileStorageProperties
        // Añadir subdirectorio específico para imágenes de perfil si es necesario, o manejarlo en el controlador/servicio que usa FileStorageService
        // Aquí, usaremos el directorio base de FileStorageProperties y asumiremos que ya apunta al lugar correcto o añadimos un subdirectorio si es consistente
        String uploadDir = fileStorageProperties.getUploadDir();
        if (uploadDir.trim().isEmpty()) {
             throw new IllegalArgumentException("File upload directory is not configured. Please set 'file.upload-dir' in application properties.");
        }
        // Podríamos añadir un subdirectorio específico si este servicio es solo para perfiles, ej: Paths.get(uploadDir, "perfiles")
        // Por ahora, usamos el directorio base y la lógica de filename en storeFile determinará el subdirectorio
        this.fileStorageLocation = Paths.get(System.getProperty("user.dir"), "mis_uploads", "perfile").toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            String errorMsg = "Could not create the directory where the uploaded files will be stored: " + this.fileStorageLocation + " - " + ex.getMessage();
            logger.error(errorMsg, ex); // Usar logger para el error
            throw new RuntimeException(errorMsg, ex);
        }
    }

    public String storeFile(MultipartFile file, String filename) throws IOException {
        // Crear el path completo del archivo destino
        Path targetLocation = this.fileStorageLocation.resolve(filename);
        logger.info("Attempting to store file {} at path {}", filename, targetLocation.toString());

        try {
            // Copiar el archivo al destino (sobrescribirá si ya existe)
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            logger.info("Successfully stored file {} at path {}", filename, targetLocation.toString());
        } catch (IOException ex) {
            logger.error("Failed to store file {} at path {}", filename, targetLocation.toString(), ex);
            throw ex; // Re-lanzar la excepción después de loguear
        }

        return filename; // Retornar el nombre del archivo guardado
    }

    public Resource loadFileAsResource(String filename) throws MalformedURLException {
        Path filePath = this.fileStorageLocation.resolve(filename).normalize();
        Resource resource = new UrlResource(filePath.toUri());

        if (resource.exists()) {
            return resource;
        } else {
            throw new RuntimeException("File not found " + filename);
        }
    }
} 