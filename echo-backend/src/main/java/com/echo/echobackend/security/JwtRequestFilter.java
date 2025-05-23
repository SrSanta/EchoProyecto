package com.echo.echobackend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
// extends OncePerRequestFilter: Asegura que este filtro se ejecute solo UNA VEZ por cada petición HTTP
public class JwtRequestFilter extends OncePerRequestFilter {

    private final MyUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;

    public JwtRequestFilter(MyUserDetailsService userDetailsService, JwtUtil jwtUtil) {
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(
            @org.springframework.lang.NonNull HttpServletRequest request, 
            @org.springframework.lang.NonNull HttpServletResponse response, 
            @org.springframework.lang.NonNull FilterChain filterChain)
            throws ServletException, IOException {

        // Permitir que cualquier petición OPTIONS pase sin validación JWT
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Si la petición es para cualquier endpoint de autenticación, no necesitamos verificar un token JWT
        if (request.getServletPath().startsWith("/api/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Intentamos obtener la cabecera 'Authorization' de la petición.
        final String authHeader = request.getHeader("Authorization");
        String username = null;
        String jwt = null;

        System.out.println("[JWT DEBUG] Authorization header: " + authHeader);

        // Verificamos si la cabecera existe
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
                System.out.println("[JWT DEBUG] Token extraído, usuario: " + username);
            } catch (Exception e) {
                System.out.println("[JWT DEBUG] Error al extraer usuario del token: " + e.getMessage());
            }
        } else {
            System.out.println("[JWT DEBUG] No hay cabecera Authorization válida");
        }

        // Validar el Token y Establecer la Autenticación en Spring Security
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            System.out.println("[JWT DEBUG] Intentando autenticar usuario " + username);


            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // Validamos el token
            if (jwtUtil.isTokenValid(jwt, userDetails)) {

                // Si el token es válido, creamos un objeto de autenticación de Spring Security
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // ¡Este es el paso CLAVE! Establecemos el objeto 'authToken' en el SecurityContextHolder.
                // Esto le dice a Spring Security: "Para esta petición actual, este usuario está autenticado".
                // A partir de aquí, Spring Security considerará la petición como autenticada,
                // y las reglas de autorización (como las de SecurityFilterChain o @PreAuthorize) funcionarán.
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // Independientemente de si se encontró y validó un token o no, debemos pasar la petición
        // al siguiente filtro en la cadena.
        // Si no se validó un token y el endpoint requiere autenticación, un filtro posterior
        // de Spring Security denegará el acceso.
        filterChain.doFilter(request, response);
    }
}
