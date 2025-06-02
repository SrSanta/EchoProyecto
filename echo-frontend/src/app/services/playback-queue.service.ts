import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { PlaybackQueue } from '../models/playback-queue.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PlaybackQueueService {
  private apiUrl = environment.apiUrl + '/api/queue';
  private queueUpdated$ = new Subject<void>();

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Add a song to the playback queue
   * @param song The song to add to the queue
   */
  addToQueue(song: any): void {
    const username = this.authService.getUsername();
    if (!username) {
      console.error('User not logged in, cannot add to queue.');
      // Opcional: mostrar un mensaje al usuario
      return;
    }

    if (!song || song.id === undefined) {
        console.error('Invalid song data, cannot add to queue.', song);
        return;
    }

    // Implementar la lógica real: llamar al método del backend
    this.addSongToQueue(username, song.id).subscribe({
        next: () => {
            console.log('Song added to queue successfully:', song);
            this.notifyQueueUpdated(); // Notificar a los suscriptores que la cola se actualizó
        },
        error: (err) => {
            console.error('Error adding song to queue:', err);
            // Opcional: mostrar un mensaje de error al usuario
        }
    });
  }

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
