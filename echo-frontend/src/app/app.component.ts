import { Component, inject, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { AsyncPipe, CommonModule } from '@angular/common';
import { PlayerStateService } from './services/player-state.service';
import { Song } from './models/song.model';
import { SongPlayerComponent } from './components/song-player/song-player.component';
import { PlaybackQueueService } from './services/playback-queue.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, AsyncPipe, CommonModule, SongPlayerComponent], // Only include components used in the template
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
  isAdmin$: Observable<boolean>;
  currentSongForPlayer$: Observable<Song | null> = this.playerStateService.currentSong$;
  hasSongsInQueue = false;

  // Propiedad para controlar la visibilidad del reproductor
  isPlayerVisible: boolean = true;

  constructor() {
    this.isLoggedIn$ = this.authService.currentUser$.pipe(map(user => !!user));
    this.username$ = this.authService.currentUser$.pipe(map(user => user?.username ?? null));
    this.isAdmin$ = this.authService.currentUser$.pipe(map(user => user?.role === 'ADMIN'));

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
    // Detener la reproducción y limpiar la canción actual
    this.playerStateService.playSong(null);

    // Vaciar la cola de reproducción al cerrar sesión
    const username = this.authService.getUsername();
    if (username) {
      this.playbackQueueService.clearQueue(username).subscribe({
        next: () => {
          console.log('Cola de reproducción vaciada al cerrar sesión');
          this.playbackQueueService.notifyQueueUpdated();
          // Proceder con el cierre de sesión después de vaciar la cola
          this.authService.logout();
          this.router.navigate(['/login']);
          console.log('Usuario desconectado');
        },
        error: (err) => {
          console.error('Error al vaciar la cola de reproducción al cerrar sesión:', err);
          // Aunque falle vaciar la cola, procedemos con el cierre de sesión
          this.authService.logout();
          this.router.navigate(['/login']);
          console.log('Usuario desconectado');
        }
      });
    } else {
       // Si no hay usuario, simplemente cerramos sesión localmente
       this.authService.logout();
       this.router.navigate(['/login']);
       console.log('Usuario desconectado (sin usuario para vaciar cola)');
    }
  }

  getYear(): number {
    return new Date().getFullYear();
  }

  // Método para alternar la visibilidad del reproductor
  togglePlayerVisibility(): void {
    this.isPlayerVisible = !this.isPlayerVisible;
  }
}
