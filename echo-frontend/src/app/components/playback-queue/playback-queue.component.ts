import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaybackQueue } from '../../models/playback-queue.model';
import { PlaybackQueueService } from '../../services/playback-queue.service';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { PlayerStateService } from '../../services/player-state.service';

@Component({
  selector: 'app-playback-queue',
  templateUrl: './playback-queue.component.html',
  styleUrls: ['./playback-queue.component.css'],
  standalone: true,
  imports: [CommonModule],
  exportAs: 'playbackQueue'
})

export class PlaybackQueueComponent implements OnInit, OnDestroy {
  queue: PlaybackQueue[] = [];
  username: string = '';
  loading = false;
  error: string | null = null;
  currentSongId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private playbackQueueService: PlaybackQueueService,
    private authService: AuthService,
    private playerStateService: PlayerStateService
  ) {}


  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.username = user?.username || '';
        if (this.username) {
          this.loadQueue();
        }
      });

    this.playbackQueueService.queueUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.username) {
          this.loadQueue();
        }
      });

    this.playerStateService.currentSong$
      .pipe(takeUntil(this.destroy$))
      .subscribe(song => {
        this.currentSongId = song?.id ?? null;
        if (this.username) {
          this.loadQueue();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadQueue() {
    this.loading = true;
    this.playbackQueueService.getQueue(this.username).subscribe({
      next: (queue) => {
        this.queue = queue;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error cargando la cola';
        this.loading = false;
      }
    });
  }

  removeSong(songId: number) {
    this.playbackQueueService.removeSongFromQueue(this.username, songId).subscribe({
      next: () => {
        this.loadQueue();
        this.playbackQueueService.notifyQueueUpdated();
      },
      error: () => this.error = 'Error eliminando canción de la cola'
    });
  }

  clearQueue() {
    this.playbackQueueService.clearQueue(this.username).subscribe({
      next: () => {
        this.loadQueue();
        this.playbackQueueService.notifyQueueUpdated();
        // Limpiar el reproductor
        this.playerStateService.playSong(null);
      },
      error: () => this.error = 'Error limpiando la cola'
    });
  }
}
