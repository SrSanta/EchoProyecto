import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AsyncPipe, CommonModule } from '@angular/common'; // Importar CommonModule
import { PlayerStateService } from './services/player-state.service'; // Importar PlayerStateService
import { Song } from './models/song.model'; // Importar Song
import { SongPlayerComponent } from './components/song-player/song-player.component'; // Importar SongPlayerComponent
import { PlaybackQueueComponent } from './components/playback-queue/playback-queue.component'; // Importar PlaybackQueueComponent

import { PlaybackQueueService } from './services/playback-queue.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, AsyncPipe, CommonModule, SongPlayerComponent, PlaybackQueueComponent], // Añadir CommonModule, SongPlayerComponent y PlaybackQueueComponent
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'echo-frontend';

  private authService = inject(AuthService);
  private playerStateService = inject(PlayerStateService);
  private playbackQueueService = inject(PlaybackQueueService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  isLoggedIn$: Observable<boolean>;
  username$: Observable<string | null>;
  currentSongForPlayer$: Observable<Song | null> = this.playerStateService.currentSong$;
  hasSongsInQueue = false;

  constructor() {
    this.isLoggedIn$ = this.authService.currentUser$.pipe(map(user => !!user));
    this.username$ = this.authService.currentUser$;

    // Suscribirse a cambios en la cola
    // Función auxiliar para actualizar el estado de la cola
    const updateQueueState = (username: string | null) => {
      if (username) {
        this.playbackQueueService.getQueue(username).subscribe(queue => {
          this.hasSongsInQueue = queue.length > 0;
        });
      } else {
        this.hasSongsInQueue = false;
      }
    };

    let currentUsername: string | null = null;
    this.username$.pipe(takeUntil(this.destroy$)).subscribe(username => {
      currentUsername = username;
      updateQueueState(username);
    });
    // Escucha los cambios de la cola SIEMPRE
    this.playbackQueueService.queueUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        updateQueueState(currentUsername);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    console.log('Usuario desconectado');
  }

  getYear(): number {
    return new Date().getFullYear();
  }
}
