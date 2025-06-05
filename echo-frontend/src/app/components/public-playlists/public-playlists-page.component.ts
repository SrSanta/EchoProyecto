import { Component, OnInit } from '@angular/core';
import { Playlist } from '../../models/playlist.model';
import { PlaylistService } from '../../services/playlist.service';
import { PlaybackQueueService } from '../../services/playback-queue.service';
import { PlayerStateService } from '../../services/player-state.service';
import { AuthService } from '../../services/auth.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-public-playlists-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './public-playlists-page.component.html',
  styleUrls: ['./public-playlists-page.component.css']
})
export class PublicPlaylistsPageComponent implements OnInit {
  publicPlaylists: Playlist[] = [];
  filteredPlaylists: Playlist[] = [];
  search: string = '';
  filterUser: string = '';
  filterSong: string = '';
  isAdmin: boolean = false;

  constructor(
    private playlistService: PlaylistService,
    private playbackQueueService: PlaybackQueueService,
    private playerStateService: PlayerStateService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();

    this.playlistService.getAllPublicPlaylists().subscribe(playlists => {
      this.publicPlaylists = playlists;
      this.filteredPlaylists = playlists;
    });
  }

  applyFilters() {
    this.filteredPlaylists = this.publicPlaylists.filter(p => {
      const matchesName = this.search ? p.name.toLowerCase().includes(this.search.toLowerCase()) : true;
      const matchesUser = this.filterUser ? (p.user?.username?.toLowerCase().includes(this.filterUser.toLowerCase()) ?? false) : true;
      const matchesSong = this.filterSong ? (p.songs && p.songs.some(song => song.title.toLowerCase().includes(this.filterSong.toLowerCase()))) : true;
      return matchesName && matchesUser && matchesSong;
    });
  }
  
  playPlaylist(playlist: Playlist) {
    if (!playlist.songs || playlist.songs.length === 0) {
      alert('No hay canciones para reproducir en esta playlist.');
      return;
    }
    const username = this.authService.getUsername();
    if (!username) {
      alert('No se pudo obtener el usuario autenticado.');
      return;
    }
    this.playbackQueueService.clearQueue(username).subscribe({
      next: () => {
        const addNext = (index: number) => {
          if (index >= playlist.songs!.length) {
            this.playbackQueueService.notifyQueueUpdated();
            // Reproducir automáticamente la primera canción
            if (playlist.songs!.length > 0) {
              this.playerStateService.playSong(playlist.songs![0]);
            }
            return;
          }
          const song = playlist.songs![index];
          if (!song.id) {
            addNext(index + 1);
            return;
          }
          this.playbackQueueService.addSongToQueue(username, song.id).subscribe({
            next: () => addNext(index + 1),
            error: () => addNext(index + 1)
          });
        };
        addNext(0);
      },
      error: () => {
        alert('No se pudo limpiar la cola de reproducción.');
      }
    });
  }

  deletePlaylist(playlistId: number | undefined) {
    if (playlistId !== undefined && confirm('¿Estás seguro de que quieres eliminar esta playlist?')) {
      this.playlistService.deletePlaylist(playlistId).subscribe({
        next: () => {
          this.publicPlaylists = this.publicPlaylists.filter(p => p.id !== playlistId);
          this.applyFilters();
          alert('Playlist eliminada con éxito.');
        },
        error: (err) => {
          console.error('Error al eliminar playlist:', err);
          alert('No se pudo eliminar la playlist.');
        }
      });
    }
  }
}
