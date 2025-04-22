package com.echo.echobackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.uploadDir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String resolvedUploadDir = Paths.get(uploadDir).toAbsolutePath().normalize().toString();

        String resourceLocation = "file:" + resolvedUploadDir.replace("\\", "/") + (resolvedUploadDir.endsWith("/") || resolvedUploadDir.endsWith("\\") ? "" : "/");

        System.out.println("--- [WebConfig] Mapeando /audio/** a la ubicación física: " + resourceLocation);

        registry.addResourceHandler("/audio/**")
                .addResourceLocations(resourceLocation);
    }
}
