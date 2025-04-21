// src/app/services/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // Necesario para SSR
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment'; // Asegúrate que environment.ts tenga apiUrl definida

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token';
  // --- ¡CAMBIO PRINCIPAL AQUÍ! ---
  // Ajusta la URL para que coincida con la configuración del backend (/api/auth/**)
  private apiUrl = `${environment.apiUrl}/api/auth`;
  // --- FIN DEL CAMBIO ---

  // Inicializa con null para compatibilidad con SSR
  private currentUserSubject = new BehaviorSubject<string | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    // Inyecta PLATFORM_ID para saber si estamos en navegador o servidor
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Intenta leer el token inicial desde localStorage SOLO si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.currentUserSubject.next(this.getUsernameFromTokenInternal());
    }
  }

  // --- Métodos auxiliares seguros para localStorage (compatibles con SSR) ---
  private getItemFromLocalStorage(key: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error(`Error reading localStorage key “${key}”:`, e);
        return null;
      }
    }
    return null; // No hay localStorage en el servidor
  }

  private setItemInLocalStorage(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error(`Error setting localStorage key “${key}”:`, e);
      }
    }
    // No hacer nada en el servidor
  }

  private removeItemFromLocalStorage(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error(`Error removing localStorage key “${key}”:`, e);
      }
    }
    // No hacer nada en el servidor
  }
  // --- Fin de métodos auxiliares ---

  /**
   * Realiza la petición de login al backend.
   * Guarda el token en localStorage y actualiza el estado del usuario actual.
   */
  login(username: string, password: string) {
    // La URL completa será, por ejemplo, http://localhost:8080/api/auth/login
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(response => {
        if (response && response.token) {
          this.setItemInLocalStorage(this.tokenKey, response.token); // Usa el auxiliar seguro
          // Actualiza el BehaviorSubject con el nombre de usuario del nuevo token
          // (Solo necesario en el navegador, ya que setItem ya lo comprueba)
          if (isPlatformBrowser(this.platformId)) {
             this.currentUserSubject.next(this.getUsernameFromTokenInternal());
          }
        } else {
          // Manejar caso donde la respuesta no tiene token (inesperado si es 2xx)
          console.error('Login successful but no token received.');
          this.logout(); // Limpiar estado por si acaso
        }
      })
      // Nota: El manejo de errores (401, etc.) se hace en el subscribe del componente
    );
  }

  /**
   * Elimina el token de localStorage y resetea el estado del usuario actual.
   */
  logout() {
    this.removeItemFromLocalStorage(this.tokenKey); // Usa el auxiliar seguro
    this.currentUserSubject.next(null); // Actualiza el estado a "no logueado"
  }

  /**
   * Obtiene el token JWT actual desde localStorage de forma segura (SSR).
   * @returns El token como string o null si no existe o no estamos en el navegador.
   */
  getToken(): string | null {
    return this.getItemFromLocalStorage(this.tokenKey); // Usa el auxiliar seguro
  }

  /**
   * Verifica si el usuario está actualmente logueado (basado en la existencia del token).
   * @returns true si hay un token, false en caso contrario.
   */
  isLoggedIn(): boolean {
    // getToken() ya es seguro para SSR
    return !!this.getToken();
  }

  /**
   * Obtiene el nombre de usuario actual almacenado en el BehaviorSubject.
   * @returns El nombre de usuario o null.
   */
  getUsername(): string | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtiene el ID del usuario desde el payload del token JWT.
   * ¡Asegúrate de que el claim 'userId' o 'id' exista en tu token!
   * @returns El ID del usuario como número o null si no se puede obtener.
   */
  getCurrentUserId(): number | null {
    const token = this.getToken(); // getToken() ya es seguro
    if (!token || !isPlatformBrowser(this.platformId)) {
        return null; // No hay token o no estamos en el navegador
    }

    try {
      // Decodifica el payload del token (considera usar una librería como jwt-decode)
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Busca el ID en los claims comunes (ajusta según tu backend)
      const userId = payload.userId || payload.id;
      return typeof userId === 'number' ? userId : null;
    } catch (err) {
      console.error('Error al decodificar el token para obtener userId:', err);
      // Si el token está corrupto, es buena idea limpiarlo
      this.removeItemFromLocalStorage(this.tokenKey);
      this.currentUserSubject.next(null); // Actualiza el estado
      return null;
    }
  }

  /**
   * Método interno y seguro para obtener el nombre de usuario desde el token.
   * Llamado al inicializar y después del login.
   * @returns El nombre de usuario (claim 'sub') o null.
   */
  private getUsernameFromTokenInternal(): string | null {
    const token = this.getToken(); // getToken() ya es seguro
    if (!token || !isPlatformBrowser(this.platformId)) {
        return null; // No hay token o no estamos en el navegador
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Asume que el claim 'sub' (subject) contiene el nombre de usuario
      return payload.sub || null;
    } catch (e) {
      console.error("Error decoding token to get username:", e);
      // Limpia el token si está corrupto
      this.removeItemFromLocalStorage(this.tokenKey);
      return null;
    }
  }
}
