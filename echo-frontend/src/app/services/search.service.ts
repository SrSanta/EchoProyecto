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
      // Si la consulta está vacía, devolver arrays vacíos
      return of({
        songs: [],
        playlists: [],
        artists: []
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
    return this.songService.searchSongs({ title: query });
  }

  /**
   * Busca playlists por nombre
   * @param query Término de búsqueda
   * @returns Observable con el array de playlists que coinciden con la búsqueda
   */
  private searchPlaylists(query: string): Observable<Playlist[]> {
    return this.playlistService.searchPlaylists(query);
  }

  /**
   * Busca artistas por nombre de usuario
   * @param query Término de búsqueda
   * @returns Observable con el array de usuarios/artistas que coinciden con la búsqueda
   */
  private searchArtists(query: string): Observable<any[]> {
    return this.userService.searchUsers(query);
  }
}
