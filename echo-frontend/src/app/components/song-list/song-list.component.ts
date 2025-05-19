import { Component, OnInit, inject } from '@angular/core';
import { SongService } from './../../services/song.service';
import { Song } from './../../models/song.model';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { PlayerStateService } from '../../services/player-state.service';
import { PlaybackQueueService } from '../../services/playback-queue.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-song-list',
  standalone: true,
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.css'],
  imports: [CommonModule], // SongPlayerComponent ya no se importa aquí
})
export class SongListComponent implements OnInit {
  songs: Song[] = [];
  loading = true;
  error: string | null = null;
  protected environment = environment;
  isAddingToQueue: { [songId: number]: boolean } = {};
  addToQueueSuccess: { [songId: number]: boolean | null } = {};

  constructor(
    private songService: SongService,
    private playerStateService: PlayerStateService,
    private playbackQueueService: PlaybackQueueService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.songService.getAllSongs().subscribe({
      next: (data) => {
        this.songs = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se pudieron cargar las canciones.';
        this.loading = false;
      },
    });
  }

  addToQueue(song: Song) {
    const username = this.authService.getUsername();
    const songId = song.id;
    if (!username || typeof songId !== 'number') return;
    this.isAddingToQueue[songId] = true;
    this.playbackQueueService.addSongToQueue(username, songId).subscribe({
      next: () => {
        this.isAddingToQueue[songId] = false;
        this.addToQueueSuccess[songId] = true;
        setTimeout(() => (this.addToQueueSuccess[songId] = null), 2000);
        this.playbackQueueService.notifyQueueUpdated(); // Notifica actualización
      },
      error: () => {
        this.isAddingToQueue[songId] = false;
        this.addToQueueSuccess[songId] = false;
        setTimeout(() => (this.addToQueueSuccess[songId] = null), 2000);
      },
    });
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
