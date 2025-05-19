import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlaylistFollowService {
  private apiUrl = environment.apiUrl + '/api/playlist-follows';

  constructor(private http: HttpClient) {}

  followPlaylist(playlistId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/follow/${playlistId}`, {});
  }

  unfollowPlaylist(playlistId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/unfollow/${playlistId}`);
  }

  setFavorite(playlistId: number, favorite: boolean): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/favorite/${playlistId}?favorite=${favorite}`, {});
  }

  getFollowedPlaylists(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }
}
