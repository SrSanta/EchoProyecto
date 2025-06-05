import { Injectable } from '@angular/core';
import { Song } from '../models/song.model';
import { AuthService } from './auth.service';
import { PlaybackQueueService } from './playback-queue.service';
import { PlayerStateService } from './player-state.service';
import { tap, catchError } from 'rxjs/operators';
import { Observable, EMPTY } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlaybackManagerService {

  constructor(
    private authService: AuthService,
    private playbackQueueService: PlaybackQueueService,
    private playerStateService: PlayerStateService
  ) { }

  playSong(song: Song): void {
    const username = this.authService.getUsername();
    if (username && typeof song.id === 'number') {
      // Clear queue, add song to queue, then play
      this.playbackQueueService.clearQueue(username).pipe(
        tap(() => console.debug('Queue cleared before playing song.')), // Add logging
        catchError(err => {
          console.error('Error clearing queue before playing:', err); // Add logging
          // Continue to add song even if clearing failed
          return EMPTY; // Return EMPTY to complete the first observable and continue
        })
      ).subscribe(() => {
        this.playbackQueueService.addSongToQueue(username, song.id as number).pipe(
          tap(() => console.debug('Song added to queue after clearing.')), // Add logging
           catchError(err => {
            console.error('Error adding song to queue before playing:', err); // Add logging
            // Continue to play song even if adding failed
            return EMPTY; // Return EMPTY to complete the second observable and continue
           })
        ).subscribe(() => {
          // Update player state to play the song
          this.playerStateService.playSong(song);
          console.debug('Player state updated for song playback.'); // Add logging
          // Notify queue updated after adding song
          this.playbackQueueService.notifyQueueUpdated();
        });
      });
    } else {
      // Play directly if not authenticated or song ID is not a number
      this.playerStateService.playSong(song);
      console.debug('Playing song directly (not authenticated or no song ID).'); // Add logging
    }
  }

  // Puedes añadir otros métodos relacionados con la gestión de reproducción y cola aquí
} 