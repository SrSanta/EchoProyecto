# 🎵 Echo - Plataforma de Streaming Musical

Echo es una plataforma de streaming musical que permite a los usuarios explorar canciones, crear listas de reproducción, dar "me gusta", ver el historial de reproducciones, y más. El proyecto está dividido en dos partes:

-   `echo-backend`: API REST construida con Spring Boot.
-   `echo-frontend`: Interfaz de usuario desarrollada con Angular.

---

## 📁 Estructura del Proyecto

\`\`\`
echo/
├── echo-backend/  # Backend con Spring Boot
└── echo-frontend/ # Frontend con Angular
\`\`\`

---

## 🚀 Tecnologías Usadas

### Backend (`echo-backend`)

-   Java 17+
-   Spring Boot
-   Spring Data JPA
-   Spring Security + JWT
-   H2 / MySQL (dependiendo del perfil)
-   Lombok
-   Maven

### Frontend (`echo-frontend`)

-   Angular 17+
-   Standalone components
-   Angular Router
-   HttpClient
-    Vite (para desarrollo rápido)

## ⚙️ Configuración del Backend

1.  Navega al directorio del backend:

    \`\`\`bash
    cd echo-backend
    \`\`\`

2.  Configura la base de datos en `application.properties` o `application.yml`:

    \`\`\`properties
    spring.datasource.url=jdbc:mysql://localhost:3306/echo
    spring.datasource.username=root
    spring.datasource.password=tu_contraseña
    \`\`\`

3.  Ejecuta el proyecto:

    \`\`\`bash
    ./mvnw spring-boot:run
    \`\`\`

    El backend se ejecutará en `http://localhost:8080`.

## 🌐 Configuración del Frontend

1.  Navega al directorio del frontend:

    \`\`\`bash
    cd echo-frontend
    \`\`\`

2.  Instala las dependencias:

    \`\`\`bash
    npm install
    \`\`\`

3.  Ejecuta el servidor de desarrollo:

    \`\`\`bash
    npm start
    \`\`\`

    El frontend se conectará al backend por defecto en `http://localhost:8080`.

## 🔐 Funcionalidades

-   Registro e inicio de sesión con JWT
-   Subida de canciones (audio/video)
-   Gestión de géneros musicales
-   "Me gusta" y reproducción de canciones
-   Historial de reproducciones
-   Listas de reproducción con orden de canciones
-   Roles de usuario (USER, ADMIN)
-   Configuración de perfil público/privado

## 📦 Scripts Útiles

### Backend

\`\`\`bash
./mvnw clean install  # Compila y construye el backend
./mvnw test          # Ejecuta los tests
\`\`\`

### Frontend

\`\`\`bash
npm run build      # Compila Angular para producción
npm run lint       # Analiza el código con eslint
\`\`\`

## 🛠 TODOs

-   Subida de imágenes para las miniaturas
-   Buscador avanzado
-   Reproductor con barra de progreso
-   Soporte multi-idioma
-   Panel de administrador

## 🧑‍💻 Autores

-   Backend: Andrés CG / SrSanta
-   Frontend: Andrés CG / SrSanta
