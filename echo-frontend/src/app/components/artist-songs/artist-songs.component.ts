import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Song } from '../../models/song.model';
import { environment } from '../../../environments/environment';
import { PlayerStateService } from '../../services/player-state.service';
import { PlaybackQueueService } from '../../services/playback-queue.service';
import { AuthService } from '../../services/auth.service';
import { PlaybackManagerService } from '../../services/playback-manager.service';

@Component({
  selector: 'app-artist-songs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './artist-songs.component.html',
  styleUrls: ['./artist-songs.component.css']
})
export class ArtistSongsComponent {
  @Input() songs: Song[] = [];

  protected environment = environment; // Make environment accessible in template

  // No need for loading, error, artistUsername, or SongService injection
  // as the songs are now passed in via @Input

  constructor(private playerStateService: PlayerStateService,
              private playbackQueueService: PlaybackQueueService,
              private authService: AuthService,
              private playbackManagerService: PlaybackManagerService
  ) {}

  getSongUrl(songFilename: string | undefined): string {
    if (!songFilename) return '';
    // Asumiendo que los archivos de audio están en /api/audio/ en el backend
    return `${environment.apiUrl}/api/audio/${songFilename}`;
  }

  getThumbnailUrl(thumbnailFilename: string | undefined): string {
    if (!thumbnailFilename) return '';
    // Asumiendo que las miniaturas están en /api/thumbnails/ en el backend
    return `${environment.apiUrl}/api/thumbnails/${thumbnailFilename}`;
  }

  playSong(song: Song) {
    const username = this.authService.getUsername();
    if (username && typeof song.id === 'number') {
      this.playbackQueueService.clearQueue(username).subscribe({
        next: () => {
          this.playbackQueueService.addSongToQueue(username, song.id as number).subscribe({
            next: () => {
              this.playerStateService.playSong(song);
            },
            error: () => {
              this.playerStateService.playSong(song); // Reproduce aunque falle la cola
            }
          });
        },
        error: () => {
          this.playerStateService.playSong(song); // Reproduce aunque falle limpiar
        }
      });
    } else {
      this.playerStateService.playSong(song);
    }
  }
} 