package com.echo.echobackend.service;

import com.echo.echobackend.model.User;
import com.echo.echobackend.security.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final MyUserDetailsService userDetailsService; // Servicio para cargar los detalles del usuario
    private final JwtUtil jwtUtil; // Clase utilitaria para generar tokens JWT

    @Autowired
    public AuthService(AuthenticationManager authenticationManager, MyUserDetailsService userDetailsService, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
    }

    public String authenticateAndGenerateToken(String username, String password) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
            if (authentication.isAuthenticated()) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                return jwtUtil.generateToken(userDetails);
            }
        } catch (Exception e) {
            // Manejar la excepción de autenticación fallida
            return null; // O lanzar una excepción personalizada
        }
        return null;
    }

    // Otros métodos relacionados con la autenticación podrían ir aquí
    // como la invalidación de tokens (si se implementa)
}