import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { PlaybackQueue } from '../models/playback-queue.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlaybackQueueService {
  private apiUrl = environment.apiUrl + '/api/queue';
  private queueUpdated$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  get queueUpdates$() {
    return this.queueUpdated$.asObservable();
  }

  notifyQueueUpdated() {
    this.queueUpdated$.next();
  }

  getQueue(username: string): Observable<PlaybackQueue[]> {
    return this.http.get<PlaybackQueue[]>(`${this.apiUrl}/${username}`);
  }

  addSongToQueue(username: string, songId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/add`, null, {
      params: { username, songId: songId.toString() },
    });
  }

  removeSongFromQueue(username: string, songId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/remove`, {
      params: { username, songId: songId.toString() },
    });
  }

  reorderQueue(username: string, songIds: number[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/reorder`, songIds, {
      params: { username },
    });
  }

  clearQueue(username: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clear`, {
      params: { username },
    });
  }

  // Actualizar toda la cola de reproducción (usando reorder)
  setQueue(username: string, songIds: number[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/reorder`, songIds, {
      params: { username },
    });
  }
}
