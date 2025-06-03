import { Component, OnInit, OnDestroy } from '@angular/core';
import { Playlist } from '../../models/playlist.model';
import { PlaylistService } from '../../services/playlist.service';
import { PlaylistFollowService } from '../../services/playlist-follow.service';
import { Song } from '../../models/song.model';
import { SongService } from '../../services/song.service';
import { AuthService } from '../../services/auth.service';
import { PlaybackQueueService } from '../../services/playback-queue.service';
import { PlayerStateService } from '../../services/player-state.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Extender la interfaz Playlist para incluir la URL de la imagen de portada
interface PlaylistWithCover extends Playlist {
  coverImageUrl?: string;
}

@Component({
  selector: 'app-playlists-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './playlists-page.component.html',
  styleUrls: ['./playlists-page.component.css']
})
export class PlaylistsPageComponent implements OnInit, OnDestroy {
  playlists: Playlist[] = [];
  loading = true;
  error: string | null = null;

  // Estado para formularios y detalle
  showCreateForm = false;
  showEditForm = false;
  showDetail = false;
  selectedPlaylist: Playlist | null = null;
  newPlaylistName = '';
  editPlaylistName = '';

  allSongs: Song[] = [];

  currentUsername: string | null = null;
  private currentUserSubscription: Subscription;

  constructor(
    private playlistService: PlaylistService,
    private songService: SongService,
    private playlistFollowService: PlaylistFollowService,
    private authService: AuthService,
    private playbackQueueService: PlaybackQueueService,
    private playerStateService: PlayerStateService
  ) {
    this.currentUserSubscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUsername = user.username;
        this.fetchPlaylists();
        this.songService.getAllSongs().subscribe({
          next: (songs) => this.allSongs = songs,
          error: () => this.allSongs = []
        });
      } else {
        this.currentUsername = null;
        this.playlists = [];
        this.allSongs = [];
      }
    });
  }

  ngOnInit(): void {
    this.fetchPlaylists();
  }

  ngOnDestroy(): void {
    if (this.currentUserSubscription) {
      this.currentUserSubscription.unsubscribe();
    }
  }

  follow(playlist: Playlist) {
    this.playlistFollowService.followPlaylist(playlist.id!).subscribe({
      next: () => {
        playlist.followed = true;
      },
      error: () => {
        alert('Error al seguir la playlist');
      }
    });
  }

  unfollow(playlist: Playlist) {
    this.playlistFollowService.unfollowPlaylist(playlist.id!).subscribe({
      next: () => {
        playlist.followed = false;
        playlist.favorite = false;
      },
      error: () => {
        alert('Error al dejar de seguir la playlist');
      }
    });
  }

  setFavorite(playlist: Playlist, favorite: boolean) {
    this.playlistFollowService.setFavorite(playlist.id!, favorite).subscribe({
      next: () => {
        playlist.favorite = favorite;
      },
      error: () => {
        alert('Error al marcar/desmarcar como favorita');
      }
    });
  }

  sharePlaylist(playlist: Playlist) {
    this.playlistService.sharePlaylist(playlist.id!).subscribe({
      next: (url) => {
        playlist.publicUrl = window.location.origin + url;
      },
      error: () => {
        alert('No se puede compartir esta playlist (¿es privada?)');
      }
    });
  }

  isOwner(playlist: Playlist): boolean {
    // Si tienes el objeto user con username
    if (playlist.user && playlist.user.username && this.currentUsername) {
      return playlist.user.username === this.currentUsername;
    }
    // Si solo tienes userId
    const currentUserId = this.authService.getCurrentUserId && this.authService.getCurrentUserId();
    if (playlist.userId && currentUserId) {
      return playlist.userId === currentUserId;
    }
    return false;
  }

  togglePublic(playlist: Playlist): void {
    console.log('Intentando alternar visibilidad:');
    console.log('isOwner:', this.isOwner(playlist));
    console.log('Objeto Playlist:', playlist);
    if (!this.isOwner(playlist)) return;
    const nuevoEstado = !playlist.isPublic;
    this.playlistService.updatePlaylist(playlist.id!, { name: playlist.name, isPublic: nuevoEstado }).subscribe({
      next: (updated) => {
        playlist.isPublic = updated.isPublic;
        // Limpiar enlace público si se vuelve privada
        if (!updated.isPublic) {
          playlist.publicUrl = undefined;
        }
      },
      error: () => {
        alert('No se pudo cambiar el estado pública/privada');
      }
    });
  }

  fetchPlaylists(): void {
    this.loading = true;
    this.playlistService.getUserPlaylists().subscribe({
      next: (playlists) => {
        // Ya no mapeamos para añadir coverImageUrl
        this.playlists = playlists;
        console.log('Playlists cargadas:', this.playlists);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error cargando playlists';
        this.loading = false;
      }
    });
  }

  openCreateForm() {
    this.newPlaylistName = '';
    this.showCreateForm = true;
  }

  createPlaylist() {
    if (!this.newPlaylistName.trim()) return;
    this.playlistService.createPlaylist({ name: this.newPlaylistName }).subscribe({
      next: () => {
        this.showCreateForm = false;
        this.fetchPlaylists();
      },
      error: () => {
        this.error = 'Error creando playlist';
      }
    });
  }

  openEditForm(playlist: Playlist) {
    this.selectedPlaylist = playlist;
    this.editPlaylistName = playlist.name;
    this.showEditForm = true;
  }

  editPlaylist() {
    if (!this.selectedPlaylist || !this.editPlaylistName.trim()) return;
    this.playlistService.updatePlaylist(this.selectedPlaylist.id!, { name: this.editPlaylistName }).subscribe({
      next: () => {
        this.showEditForm = false;
        this.selectedPlaylist = null;
        this.fetchPlaylists();
      },
      error: () => {
        this.error = 'Error editando playlist';
      }
    });
  }

  deletePlaylist(playlist: Playlist) {
    if (!confirm('¿Seguro que quieres eliminar esta playlist?')) return;
    this.playlistService.deletePlaylist(playlist.id!).subscribe({
      next: () => {
        this.fetchPlaylists();
      },
      error: () => {
        this.error = 'Error eliminando playlist';
      }
    });
  }

  viewDetail(playlist: Playlist) {
    // Recarga la playlist para obtener canciones actualizadas
    this.playlistService.getPlaylistById(playlist.id!).subscribe({
      next: (p) => {
        // Ya no necesitamos añadir coverImageUrl aquí
        this.selectedPlaylist = p;
        this.showDetail = true;
        this.showCreateForm = false;
        this.showEditForm = false;
      },
      error: () => {
        this.selectedPlaylist = playlist;
        this.showDetail = true;
        this.showCreateForm = false;
        this.showEditForm = false;
      }
    });
  }

  closeDetail() {
    this.selectedPlaylist = null;
    this.showDetail = false;
  }

  addSongToPlaylist(song: Song) {
    if (!this.selectedPlaylist || song.id === undefined) return;
    this.error = null;
    this.playlistService.addSongToPlaylist(this.selectedPlaylist.id!, song.id).subscribe({
      next: () => {
        // Recarga el detalle de la playlist
        this.playlistService.getPlaylistById(this.selectedPlaylist!.id!).subscribe(p => this.selectedPlaylist = p);
      },
      error: (err) => {
        if (err && err.error && typeof err.error === 'string' && err.error.includes('ya está en la playlist')) {
          this.error = 'La canción ya está en la playlist.';
        } else {
          this.error = 'Error agregando canción a la playlist';
        }
      }
    });
  }

  removeSongFromPlaylist(song: Song) {
    if (!this.selectedPlaylist || song.id === undefined) return;
    this.playlistService.removeSongFromPlaylist(this.selectedPlaylist.id!, song.id).subscribe({
      next: () => {
        // Recarga el detalle de la playlist
        this.playlistService.getPlaylistById(this.selectedPlaylist!.id!).subscribe(p => this.selectedPlaylist = p);
      }
    });
  }

  isSongInPlaylist(song: Song): boolean {
    return !!this.selectedPlaylist && Array.isArray(this.selectedPlaylist.songs) && this.selectedPlaylist.songs.some(s => s.id === song.id);
  }

  get playlistSongsWithId(): Song[] {
    return this.selectedPlaylist && Array.isArray(this.selectedPlaylist.songs)
      ? this.selectedPlaylist.songs.filter(s => s.id !== undefined)
      : [];
  }

  get allSongsWithId(): Song[] {
    return this.allSongs.filter(s => s.id !== undefined);
  }

  cancelForms() {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.selectedPlaylist = null;
  }

  playPlaylist() {
    if (!this.selectedPlaylist || !this.selectedPlaylist.songs || this.selectedPlaylist.songs.length === 0) {
      this.error = 'No hay canciones para reproducir en esta playlist.';
      return;
    }
    const username = this.authService.getUsername();
    if (!username) {
      this.error = 'No se pudo obtener el usuario autenticado.';
      return;
    }
    // Limpiar la cola antes de añadir todas las canciones
    this.playbackQueueService.clearQueue(username).subscribe({
      next: () => {
        // Añadir todas las canciones en orden
        const addNext = (index: number) => {
          if (index >= this.selectedPlaylist!.songs!.length) {
            this.playbackQueueService.notifyQueueUpdated();
            // Reproducir automáticamente la primera canción
            if (this.selectedPlaylist!.songs!.length > 0) {
              this.playerStateService.playSong(this.selectedPlaylist!.songs![0]);
            }
            return;
          }
          const song = this.selectedPlaylist!.songs![index];
          if (!song.id) {
            addNext(index + 1);
            return;
          }
          this.playbackQueueService.addSongToQueue(username, song.id).subscribe({
            next: () => addNext(index + 1),
            error: () => addNext(index + 1) // Si falla una, sigue con las demás
          });
        };
        addNext(0);
      },
      error: () => {
        this.error = 'No se pudo limpiar la cola de reproducción.';
      }
    });
  }
}
