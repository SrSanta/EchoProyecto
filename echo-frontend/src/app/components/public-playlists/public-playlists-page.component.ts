import { Component, OnInit } from '@angular/core';
import { Playlist } from '../../models/playlist.model';
import { User } from '../../models/user.model';
import { PlaylistService } from '../../services/playlist.service';
import { PlaybackQueueService } from '../../services/playback-queue.service';
import { PlayerStateService } from '../../services/player-state.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

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
  allUsers: User[] = [];

  constructor(
    private playlistService: PlaylistService,
    private playbackQueueService: PlaybackQueueService,
    private playerStateService: PlayerStateService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();

    forkJoin({
      playlists: this.playlistService.getAllPublicPlaylists(),
      users: this.userService.getArtists()
    }).subscribe({
      next: ({ playlists, users }) => {
        this.publicPlaylists = playlists;
        this.filteredPlaylists = playlists;
        this.allUsers = users;
        console.log('Playlists cargadas:', this.publicPlaylists);
        console.log('Usuarios cargados (artistas):', this.allUsers);
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        alert('Error al cargar las playlists o usuarios.');
      }
    });
  }

  getUserUsername(userId: number | undefined): string {
    if (userId === undefined) {
      return 'Desconocido';
    }
    const user = this.allUsers.find(u => u.id === userId);
    return user ? user.username : 'Desconocido';
  }

  applyFilters() {
    this.filteredPlaylists = this.publicPlaylists.filter(p => {
      const matchesName = this.search ? p.name.toLowerCase().includes(this.search.toLowerCase()) : true;
      const creatorUsername = this.getUserUsername(p.userId);
      const matchesUser = this.filterUser ? creatorUsername.toLowerCase().includes(this.filterUser.toLowerCase()) : true;
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
