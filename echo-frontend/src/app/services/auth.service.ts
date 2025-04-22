// src/app/services/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token';
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUserSubject = new BehaviorSubject<string | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.currentUserSubject.next(this.getUsernameFromTokenInternal());
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

  login(username: string, password: string) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(response => {
        if (response && response.token) {
          this.setItemInLocalStorage(this.tokenKey, response.token);
          if (isPlatformBrowser(this.platformId)) {
             this.currentUserSubject.next(this.getUsernameFromTokenInternal());
          }
        } else {
          console.error('Login successful but no token received.');
          this.logout();
        }
      })
    );
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
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): number | null {
    const token = this.getToken();
    if (!token || !isPlatformBrowser(this.platformId)) {
        return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId || payload.id;
      return typeof userId === 'number' ? userId : null;
    } catch (err) {
      console.error('Error al decodificar el token para obtener userId:', err);
      this.removeItemFromLocalStorage(this.tokenKey);
      this.currentUserSubject.next(null);
      return null;
    }
  }

  private getUsernameFromTokenInternal(): string | null {
    const token = this.getToken();
    if (!token || !isPlatformBrowser(this.platformId)) {
        return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || null;
    } catch (e) {
      console.error("Error decoding token to get username:", e);
      this.removeItemFromLocalStorage(this.tokenKey);
      return null;
    }
  }
}
