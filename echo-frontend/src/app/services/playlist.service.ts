import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Playlist } from '../models/playlist.model';
import { environment } from '../../environments/environment';

import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PlaylistService {
  private apiUrl = environment.apiUrl + '/api/playlists';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getUserPlaylists(): Observable<Playlist[]> {
    const username = this.authService.getUsername();
    // Ahora pasamos el usuario actual para integración social
    return this.http.get<Playlist[]>(`${this.apiUrl}/user/${username}?currentUser=${username}`);
  }

  getPlaylistsByUser(targetUser: string): Observable<Playlist[]> {
    const username = this.authService.getUsername();
    return this.http.get<Playlist[]>(`${this.apiUrl}/user/${targetUser}?currentUser=${username}`);
  }

  createPlaylist(playlist: Partial<Playlist>): Observable<Playlist> {
    const username = this.authService.getUsername();
    return this.http.post<Playlist>(`${this.apiUrl}?username=${username}`, playlist);
  }

  updatePlaylist(id: number, playlist: Partial<Playlist>): Observable<Playlist> {
    const username = this.authService.getUsername();
    return this.http.put<Playlist>(`${this.apiUrl}/${id}?username=${username}`, playlist);
  }

  deletePlaylist(id: number): Observable<void> {
    const username = this.authService.getUsername();
    return this.http.delete<void>(`${this.apiUrl}/${id}?username=${username}`);
  }

  getPlaylistById(id: number): Observable<Playlist> {
    return this.http.get<Playlist>(`${this.apiUrl}/${id}`);
  }

  addSongToPlaylist(playlistId: number, songId: number, songOrder?: number): Observable<void> {
    const username = this.authService.getUsername();
    let params: any = { songId, username };
    if (songOrder !== undefined) {
      params.songOrder = songOrder;
    }
    const url = `${this.apiUrl}/${playlistId}/songs`;
    return this.http.post<void>(url, {}, { params });
  }

  removeSongFromPlaylist(playlistId: number, songId: number): Observable<void> {
    const username = this.authService.getUsername();
    return this.http.delete<void>(`${this.apiUrl}/${playlistId}/songs?username=${username}&songId=${songId}`);
  }

  /** Compartir playlist pública: devuelve la URL pública si la playlist es pública */
  sharePlaylist(playlistId: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/share/${playlistId}`, { responseType: 'text' });
  }

  /** Obtener todas las playlists públicas */
  getAllPublicPlaylists(): Observable<Playlist[]> {
    return this.http.get<Playlist[]>(`${this.apiUrl}/public`);
  }

  /** Obtener playlist pública por enlace */
  getPublicPlaylist(playlistId: number): Observable<Playlist> {
    return this.http.get<Playlist>(`${this.apiUrl}/public/${playlistId}`);
  }
}


