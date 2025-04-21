package com.echo.echobackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry; // <-- Importar
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
// Ya no necesitas CorsRegistry
// import org.springframework.web.servlet.config.annotation.CorsRegistry;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // --- ELIMINA O COMENTA ESTE MÉTODO ---
    /*
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Esta configuración es redundante porque ya está en SecurityBeansConfig
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
    */

    // --- AÑADE ESTE MÉTODO ---
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Mapea las peticiones que empiezan con /audio/**
        registry.addResourceHandler("/audio/**")
                // A la ubicación dentro del classpath donde están tus archivos.
                // Como están en src/main/resources/uploads/audio/, la ruta classpath es /uploads/audio/
                // ¡Asegúrate que la ruta termine con '/'!
                .addResourceLocations("classpath:/uploads/audio/");
    }

    // Puedes añadir otras configuraciones de WebMvcConfigurer aquí si las necesitas.
}
