package com.echo.echobackend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Recurso no encontrado
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Object> handleNotFound(ResourceNotFoundException ex) {
        logger.error("Resource not found: {}", ex.getMessage(), ex);
        return buildResponse(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    // Acceso no autorizado
    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<Object> handleUnauthorized(UnauthorizedAccessException ex) {
        logger.error("Unauthorized access: {}", ex.getMessage(), ex);
        return buildResponse(ex.getMessage(), HttpStatus.FORBIDDEN);
    }

    // Errores de parámetros inválidos, duplicados, etc.
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleBadRequest(IllegalArgumentException ex) {
        logger.error("Bad request: {}", ex.getMessage(), ex);
        return buildResponse(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    // Otros errores no controlados
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGenericException(Exception ex) {
        logger.error("Internal server error", ex);
        return buildResponse("Error interno del servidor", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Metodo auxiliar para armar la respuesta
    private ResponseEntity<Object> buildResponse(String message, HttpStatus status) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);

        return new ResponseEntity<>(body, status);
    }

    @ExceptionHandler(SongNotFoundException.class)
    public ResponseEntity<String> handleSongNotFound(SongNotFoundException e) {
        logger.error("Song not found: {}", e.getMessage(), e);
        return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
    }
}
