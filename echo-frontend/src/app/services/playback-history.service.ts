import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PlaybackHistory {
  id: number;
  username: string;
  songId?: number;
  song?: {
    id: number;
    title: string;
    artist?: string;
    user?: {
      id: number;
      username: string;
    };
  };
  playbackTime?: string;
  playbackTimestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class PlaybackHistoryService {
  private apiUrl = environment.apiUrl + '/api/history';

  constructor(private http: HttpClient) {}

  /** Registrar una reproducción */
  recordPlayback(username: string, songId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/record`, null, {
      params: { username, songId: songId.toString() },
    });
  }

  /** Obtener historial de un usuario */
  getUserHistory(username: string): Observable<PlaybackHistory[]> {
    return this.http.get<PlaybackHistory[]>(`${this.apiUrl}/${username}`);
  }
}
