import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

export interface AuthUser {
  username: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token';
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.currentUserSubject.next(this.getUserFromTokenInternal());
    }
  }

  private getItemFromLocalStorage(key: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error(`Error reading localStorage key “${key}”:`, e);
        return null;
      }
    }
    return null;
  }

  private setItemInLocalStorage(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error(`Error setting localStorage key “${key}”:`, e);
      }
    }
  }

  private removeItemFromLocalStorage(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error(`Error removing localStorage key “${key}”:`, e);
      }
    }
  }
  
  login(username: string, password: string): Observable<{ token: string }> {
    console.log('Intentando login para usuario:', username);
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(response => {
        console.log('Respuesta del login:', response);
        if (response && response.token) {
          console.log('Token recibido, intentando guardar en localStorage...');
          this.setItemInLocalStorage(this.tokenKey, response.token);
          if (isPlatformBrowser(this.platformId)) {
            const authUser = this.getUserFromTokenInternal();
            this.currentUserSubject.next(authUser);
          }
        } else {
          console.error('Login successful but no token received.');
          console.log('No se recibió token, llamando a logout...');
          this.logout();
        }
      })
    );
  }

  register(userData: Omit<User, 'id' | 'registrationDate' | 'isProfilePublic'> & { roles: { name: string }[] }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userData);
}

  logout() {
    this.removeItemFromLocalStorage(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return this.getItemFromLocalStorage(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUsername(): string | null {
    return this.currentUserSubject.value?.username || null;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  getCurrentUserId(): number | null {
    const token = this.getToken();
    if (!token || !isPlatformBrowser(this.platformId)) {
        return null;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId || payload.id || payload.sub;
      const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      return typeof numericUserId === 'number' && !isNaN(numericUserId) ? numericUserId : null;
    } catch (err) {
      console.error('Error al decodificar el token para obtener userId:', err);
      this.logout();
      return null;
    }
  }

  private getUserFromTokenInternal(): AuthUser | null {
    const token = this.getToken();
    if (!token || !isPlatformBrowser(this.platformId)) {
        return null;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const username = payload.sub || null;
      let role: string | undefined = undefined;

      if (payload.roles && Array.isArray(payload.roles)) {
        if (payload.roles.includes('ROLE_ADMIN')) {
          role = 'ADMIN';
        } else if (payload.roles.length > 0) {
            // Opcional: Puedes asignar el primer rol encontrado si no es ADMIN
            // Por ahora, si no es ADMIN y tiene otros roles, el rol seguirá siendo undefined
        }
      }

      if (username) {
        return { username, role };
      } else {
        console.error("Token payload missing username ('sub')", payload);
        this.removeItemFromLocalStorage(this.tokenKey);
        return null;
      }
    } catch (e) {
      console.error("Error decoding token to get user info:", e);
      this.removeItemFromLocalStorage(this.tokenKey);
      return null;
    }
  }

  getAuthenticatedUser(): AuthUser | null {
      return this.currentUserSubject.value;
  }
}
