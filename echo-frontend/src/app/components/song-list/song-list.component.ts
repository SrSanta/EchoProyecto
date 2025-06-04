import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { SongService } from './../../services/song.service';
import { Song } from './../../models/song.model';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { PlayerStateService } from '../../services/player-state.service';
import { PlaybackQueueService } from '../../services/playback-queue.service';
import { AuthService } from '../../services/auth.service';
import { PlaylistService } from '../../services/playlist.service';
import { Playlist } from '../../models/playlist.model';
import { ContextMenuComponent } from '../context-menu/context-menu.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-song-list',
  standalone: true,
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.css'],
  imports: [CommonModule, ContextMenuComponent],
})
export class SongListComponent implements OnInit {
  @ViewChild('contextMenu') contextMenuRef!: ElementRef;
  
  songs: Song[] = [];
  loading = true;
  error: string | null = null;
  protected environment = environment;
  isAddingToQueue: { [songId: number]: boolean } = {};
  addToQueueSuccess: { [songId: number]: boolean | null } = {};
  
  // Variables para el menú contextual
  showContextMenu = false;
  contextMenuPosition = { x: 0, y: 0 };
  selectedSongId: number | null = null;
  userPlaylists: Playlist[] = [];
  loadingPlaylists = false;
  contextMenuError: string | null = null;
  addToPlaylistSuccess: string | null = null;
  showMessage: boolean = false;

  constructor(
    private songService: SongService,
    private playerStateService: PlayerStateService,
    private playbackQueueService: PlaybackQueueService,
    private authService: AuthService,
    private playlistService: PlaylistService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Cargar canciones
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

      // Cargar playlists del usuario si está autenticado
      if (this.authService.isAuthenticated()) {
        await this.loadUserPlaylists();
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.error = 'Error al cargar los datos. Por favor, recarga la página.';
    }
  }

  private async loadUserPlaylists(): Promise<void> {
    try {
      this.loadingPlaylists = true;
      const username = this.authService.getUsername();
      if (!username) return;
      
      const playlists = await firstValueFrom(this.playlistService.getUserPlaylists());
      this.userPlaylists = playlists;
    } catch (error) {
      console.error('Error al cargar las playlists:', error);
      this.contextMenuError = 'No se pudieron cargar las playlists.';
    } finally {
      this.loadingPlaylists = false;
    }
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

  // Métodos para el menú contextual
  onSongContextMenu(event: MouseEvent, songId: number | undefined) {
    // Si no hay un ID de canción válido, no hacemos nada
    if (songId === undefined) return;
    
    event.preventDefault();
    
    // Si no hay playlists, no mostramos el menú
    if (this.userPlaylists.length === 0 && !this.loadingPlaylists) {
      this.contextMenuError = 'No tienes playlists. Crea una desde tu perfil.';
      return;
    }
    
    this.selectedSongId = songId;
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.showContextMenu = true;
    
    // Asegurarse de que el menú no se salga de la pantalla
    setTimeout(() => {
      if (this.contextMenuRef && this.contextMenuRef.nativeElement) {
        const menu = this.contextMenuRef.nativeElement;
        const rect = menu.getBoundingClientRect();
        
        if (rect.right > window.innerWidth) {
          this.contextMenuPosition.x = window.innerWidth - rect.width - 10;
        }
        
        if (rect.bottom > window.innerHeight) {
          this.contextMenuPosition.y = window.innerHeight - rect.height - 10;
        }
      }
    });
  }
  
  onAddToPlaylistHandler(event: { playlistId: number, songId: number }) {
    if (!this.authService.isAuthenticated()) {
      this.contextMenuError = 'Debes iniciar sesión para añadir canciones a playlists.';
      return;
    }
    
    this.playlistService.addSongToPlaylist(event.playlistId, event.songId).subscribe({
      next: () => {
        console.log('Song added to playlist successfully.');
        this.addToPlaylistSuccess = 'Canción añadida a la playlist con éxito.';
        this.showMessage = true;
        this.showContextMenu = false;
        setTimeout(() => this.showMessage = false, 3100);
      },
      error: (err) => {
        console.error('Error al añadir canción a la playlist:', err);
        this.contextMenuError = 'Error al añadir la canción a la playlist. Inténtalo de nuevo.';
      }
    });
  }
  
  // Maneja el evento de añadir a la cola desde el menú contextual
  onAddToQueueFromContextMenu(songId: number) {
    const song = this.songs.find(s => s.id === songId);
    if (!song) return;
    
    // Cerrar el menú después de un breve retraso para dar feedback visual
    setTimeout(() => {
      this.showContextMenu = false;
    }, 300);
    
    // Llamar al método existente para añadir a la cola
    this.addToQueue(song);
  }
}
