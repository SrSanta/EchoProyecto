import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Song } from '../models/song.model';
import { Playlist } from '../models/playlist.model';
import { SongService } from './song.service';
import { PlaylistService } from './playlist.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = environment.apiUrl;
  private songService = inject(SongService);
  private playlistService = inject(PlaylistService);
  private userService = inject(UserService);
  private http = inject(HttpClient);

  /**
   * Realiza una búsqueda en todos los tipos de contenido
   * @param query Término de búsqueda
   * @returns Observable con los resultados de la búsqueda
   */
  searchAll(query: string): Observable<{
    songs: Song[];
    playlists: Playlist[];
    artists: any[];
  }> {
    if (!query.trim()) {
      // Si la consulta está vacía, devolver todo el contenido
      return forkJoin({
        songs: this.songService.getSongs().pipe(
          catchError(error => {
            console.error('Error cargando canciones:', error);
            return of([]);
          })
        ),
        playlists: this.playlistService.getAllPlaylists().pipe(
          catchError(error => {
            console.error('Error cargando playlists:', error);
            return of([]);
          })
        ),
        artists: this.userService.getArtists().pipe(
          catchError(error => {
            console.error('Error cargando artistas:', error);
            return of([]);
          })
        )
      });
    }

    return forkJoin({
      songs: this.searchSongs(query).pipe(
        catchError(error => {
          console.error('Error buscando canciones:', error);
          return of([]);
        })
      ),
      playlists: this.searchPlaylists(query).pipe(
        catchError(error => {
          console.error('Error buscando playlists:', error);
          return of([]);
        })
      ),
      artists: this.searchArtists(query).pipe(
        catchError(error => {
          console.error('Error buscando artistas:', error);
          return of([]);
        })
      )
    });
  }

  /**
   * Busca canciones por título
   * @param query Término de búsqueda
   * @returns Observable con el array de canciones que coinciden con la búsqueda
   */
  private searchSongs(query: string): Observable<Song[]> {
    if (!query.trim()) {
      return this.songService.getSongs();
    }
    return this.http.get<Song[]>(`${this.apiUrl}/api/songs/search?title=${encodeURIComponent(query)}`);
  }

  /**
   * Busca playlists por nombre
   * @param query Término de búsqueda
   * @returns Observable con el array de playlists que coinciden con la búsqueda
   */
  private searchPlaylists(query: string): Observable<Playlist[]> {
    if (!query.trim()) {
      return this.playlistService.getAllPlaylists();
    }
    return this.http.get<Playlist[]>(`${this.apiUrl}/api/playlists/search?name=${encodeURIComponent(query)}`);
  }

  /**
   * Busca artistas por nombre de usuario
   * @param query Término de búsqueda
   * @returns Observable con el array de usuarios/artistas que coinciden con la búsqueda
   */
  private searchArtists(query: string): Observable<any[]> {
    if (!query.trim()) {
      return this.userService.getArtists();
    }
    return this.http.get<any[]>(`${this.apiUrl}/api/users/search?username=${encodeURIComponent(query)}`);
  }
}
