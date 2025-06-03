// src/app/services/song.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Song } from '../models/song.model';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError } from 'rxjs/operators';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class SongService {
  private apiUrl = `${environment.apiUrl}/api/songs`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  uploadSong(formData: FormData): Observable<Song> {
    return this.http.post<Song>(`${this.apiUrl}/upload`, formData);
  }

  getAllSongs(): Observable<Song[]> {
    return this.http.get<Song[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error loading all songs:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  // Alias para mantener consistencia con otros servicios
  getSongs(): Observable<Song[]> {
    return this.getAllSongs();
  }

  getSongById(id: number): Observable<Song | undefined> {
    return this.http.get<Song>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error loading song ${id}:`, error);
        return of(undefined); // Return undefined on error
      })
    );
  }

  /**
   * Busca canciones por diferentes parámetros
   * @param params Objeto con los parámetros de búsqueda (genre, artist, title)
   * @returns Observable con el array de canciones que coinciden con la búsqueda
   */
  searchSongs(params: { genre?: string; artist?: string; title?: string }): Observable<Song[]> {
    const cleanParams: { [key: string]: string } = {};
    for (const key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = value;
        }
      }
    }
    const query = new URLSearchParams(cleanParams).toString();
    return this.http.get<Song[]>(`${this.apiUrl}/search?${query}`);
  }

  getUserSongs(): Observable<Song[]> {
    const token = this.authService.getToken();
    console.log('Token obtenido para getUserSongs:', token);
    const headers = token ? new HttpHeaders({
      'Authorization': `Bearer ${token}`
    }) : undefined;

    return this.http.get<Song[]>(`${this.apiUrl}/user`, { headers: headers }).pipe(
      catchError(error => {
        console.error('Error loading user songs.', error);
        return of([]);
      })
    );
  }

  deleteSong(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error deleting song ${id}:`, error);
        throw error; // Rethrow to be caught by component if needed
      })
    );
  }

  /**
   * Obtener canciones por nombre de usuario.
   * @param username El nombre de usuario del artista.
   * @returns Observable con un array de Song.
   */
  getSongsByUsername(username: string): Observable<Song[]> {
    if (!username || username.trim().length === 0) {
      return of([]);
    }
    return this.http.get<Song[]>(`${this.apiUrl}/user/${username}`).pipe(
      catchError(error => {
        console.error(`Error loading songs for user ${username}:`, error);
        return of([]);
      })
    );
  }

  // updateSongMetadata(id: number, songData: Partial<Song>): Observable<Song> {
  //   // Asegúrate de enviar solo los campos permitidos para actualizar
  //   const updatePayload = { title: songData.title, genre: songData.genre /* otros */ };
  //   return this.http.put<Song>(`${this.apiUrl}/${id}`, updatePayload);
  // }
}
