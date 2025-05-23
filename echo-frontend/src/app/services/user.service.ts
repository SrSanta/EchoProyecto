import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl + '/api/users';

  constructor(private http: HttpClient) {}

  /**
   * Busca usuarios por nombre de usuario
   * @param username Nombre de usuario a buscar
   * @returns Observable con el array de usuarios que coinciden con la búsqueda
   */
  searchUsers(username: string): Observable<any[]> {
    if (!username || username.trim().length < 2) {
      return of([]);
    }
    
    return this.http.get<any[]>(`${this.apiUrl}/search?username=${encodeURIComponent(username)}`).pipe(
      catchError(error => {
        console.error('Error buscando usuarios:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene todos los artistas
   * @returns Observable con el array de artistas
   */
  getArtists(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/artists`).pipe(
      catchError(error => {
        console.error('Error cargando artistas:', error);
        return of([]);
      })
    );
  }
}
