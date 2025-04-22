package com.echo.echobackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
// Implementa WebMvcConfigurer para permitir la personalización de la configuración de Spring MVC.
public class WebConfig implements WebMvcConfigurer {

    // Sobrescribe este método para añadir manejadores de recursos estáticos.
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Configura un manejador para las peticiones que empiecen con "/audio/**".
        registry.addResourceHandler("/audio/**")
                // Indica que los archivos para esas peticiones se deben buscar en la carpeta "uploads/audio/" dentro del classpath.
                // Esto permite servir archivos estáticos (como los de audio subidos) directamente.
                .addResourceLocations("classpath:/uploads/audio/");
    }
}
