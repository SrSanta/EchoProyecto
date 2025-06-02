import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaybackHistoryService, PlaybackHistory } from '../../services/playback-history.service';
import { AuthService } from '../../services/auth.service';
import { SongService } from '../../services/song.service';
import { Song } from '../../models/song.model';

@Component({
  selector: 'app-playback-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './playback-history.component.html',
  styleUrls: ['./playback-history.component.css']
})
export class PlaybackHistoryComponent implements OnInit {
  history: PlaybackHistory[] = [];
  loading = true;
  error: string | null = null;
  songTitles: { [songId: number]: string } = {};
  songArtists: { [songId: number]: string } = {};


  constructor(
    private historyService: PlaybackHistoryService,
    private authService: AuthService,
    private songService: SongService
  ) {}

  ngOnInit() {
    const username = this.authService.getUsername();
    if (!username) {
      this.error = 'No se ha iniciado sesión.';
      this.loading = false;
      return;
    }
    this.historyService.getUserHistory(username).subscribe({
      next: (data) => {
        this.history = data;
        this.loading = false;
        this.loadSongTitles();
      },
      error: (err) => {
        this.error = 'No se pudo cargar el historial.';
        this.loading = false;
      }
    });
  }

  private loadSongTitles() {
    // Soporta tanto entradas con songId como con song.id
    const ids: number[] = [];
    this.history.forEach(h => {
      // Si viene el objeto song completo
      if (h['song'] && typeof h['song'].id === 'number') {
        const song = h['song'];
        this.songTitles[song.id] = song.title || '(desconocido)';
        // Si la canción tiene el usuario (artista), úsalo
        this.songArtists[song.id] = (song.user && song.user.username) ? song.user.username : (song.artist || '(desconocido)');
      } else if (typeof h.songId === 'number') {
        // Si solo viene el id
        ids.push(h.songId);
      }
    });
    // Solo busca los que no están ya cargados
    const uniqueSongIds = Array.from(new Set(ids)).filter(id => !(id in this.songTitles));
    uniqueSongIds.forEach(songId => {
      if (typeof songId !== 'number' || isNaN(songId)) return;
      this.songService.getSongById(songId).subscribe({
        next: (song: Song | undefined) => {
          if (song) {
            this.songTitles[songId] = song.title;
            this.songArtists[songId] = song.artist || '(desconocido)';
          } else {
            this.songTitles[songId] = '(desconocido)';
            this.songArtists[songId] = '(desconocido)';
          }
        },
        error: () => {
          this.songTitles[songId] = '(desconocido)';
          this.songArtists[songId] = '(desconocido)';
        }
      });
    });
  }
}
