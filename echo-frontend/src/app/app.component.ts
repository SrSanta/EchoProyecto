import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AsyncPipe, CommonModule } from '@angular/common'; // Importar CommonModule
import { PlayerStateService } from './services/player-state.service'; // Importar PlayerStateService
import { Song } from './models/song.model'; // Importar Song
import { SongPlayerComponent } from './components/song-player/song-player.component'; // Importar SongPlayerComponent

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, AsyncPipe, CommonModule, SongPlayerComponent], // Añadir CommonModule y SongPlayerComponent
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'echo-frontend';

  private authService = inject(AuthService);
  private playerStateService = inject(PlayerStateService);
  private router = inject(Router);

  isLoggedIn$: Observable<boolean>;
  username$: Observable<string | null>;
  currentSongForPlayer$: Observable<Song | null> = this.playerStateService.currentSong$;

  constructor() {
    this.isLoggedIn$ = this.authService.currentUser$.pipe(map(user => !!user));
    this.username$ = this.authService.currentUser$;
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
