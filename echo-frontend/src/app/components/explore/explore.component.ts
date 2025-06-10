import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';

import { SearchService } from '../../services/search.service';
import { Song } from '../../models/song.model';
import { Playlist } from '../../models/playlist.model';
import { PlayerStateService } from '../../services/player-state.service';
import { environment } from '../../../environments/environment';
import { PlaybackQueueService } from '../../services/playback-queue.service';
import { AuthService } from '../../services/auth.service';
import { PlaylistService } from '../../services/playlist.service';
import { ContextMenuComponent } from '../context-menu/context-menu.component';
import { firstValueFrom } from 'rxjs';
import { PlaybackManagerService } from '../../services/playback-manager.service';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ContextMenuComponent],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent implements OnInit, OnDestroy {
  private searchService = inject(SearchService);
  private playerStateService = inject(PlayerStateService);
  private playbackQueueService = inject(PlaybackQueueService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private playlistService = inject(PlaylistService);
  private playbackManagerService = inject(PlaybackManagerService);
  
  searchQuery: string = '';
  searchResults: { songs: Song[]; playlists: Playlist[]; artists: any[] } | null = null;
  loading: boolean = false;
  error: string | null = null;
  environment = environment;
  activeTab: string | null = null; // null significa que se muestra todo
  showAll: boolean = true; // Mostrar todo por defecto
  
  private searchTerms = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Variables para el menú contextual
  showContextMenu = false;
  contextMenuPosition = { x: 0, y: 0 };
  selectedSongId: number | null = null;
  userPlaylists: Playlist[] = [];
  loadingPlaylists = false;
  contextMenuError: string | null = null;
  addToPlaylistSuccess: string | null = null;
  showMessage: boolean = false; // <-- Nueva variable para controlar la visibilidad

  // Nueva variable para la ventana modal de playlist
  selectedPlaylistForModal: Playlist | null = null;

  ngOnInit(): void {
    // Cargar todo el contenido al inicio
    this.loadAllContent();
    
    // Configurar la búsqueda
    this.setupSearch();

    // Cargar playlists del usuario si está autenticado para el menú contextual
    if (this.authService.isAuthenticated()) {
      this.loadUserPlaylists();
    }
  }
  
  getProfileImageUrl(artist: any): string {
    if (artist && artist.profileImage) {
        return `${environment.apiUrl}/api/users/profile-image/${artist.profileImage}`;
    }
    return 'https://ui-avatars.com/api/?name=' + (artist?.username || 'U') + '&background=cccccc&color=333333&size=128';
  }

  private loadAllContent(): void {
    console.log('Loading all content...');
    this.loading = true;
    this.searchService.searchAll('').subscribe({
      next: (results) => {
        // Procesar artistas para construir la URL completa de la imagen de perfil
        if (results.artists && results.artists.length > 0) {
          results.artists.forEach(artist => {
            artist.avatarUrl = artist.profileImage 
              ? `${environment.apiUrl}/api/users/profile-image/${artist.profileImage}` 
              : 'assets/images/default-avatar.png';
          });
        }
        this.searchResults = results;
        this.loading = false;
      },
      error: (error) => {
        console.error('loadAllContent - Error calling SearchService searchAll:', error);
        this.error = 'Error al cargar el contenido. Por favor, inténtalo de nuevo.';
        this.loading = false;
      }
    });
  }
  
  private setupSearch(): void {
    console.log('Setting up search observable...');
    this.searchTerms.pipe(
      debounceTime(500),
      tap(term => console.log('After debounceTime:', term)),
      distinctUntilChanged(),
      tap(term => console.log('After distinctUntilChanged:', term)),
      switchMap(term => {
        this.loading = true;
        this.error = null;
        console.log('Calling searchService.searchAll with term:', term);
        return this.searchService.searchAll(term);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results) => {
        // Procesar artistas para construir la URL completa de la imagen de perfil
        if (results.artists && results.artists.length > 0) {
          results.artists.forEach(artist => {
            artist.avatarUrl = artist.profileImage 
              ? `${environment.apiUrl}/api/users/profile-image/${artist.profileImage}` 
              : 'assets/images/default-avatar.png';
          });
        }
        this.searchResults = results;
        this.loading = false;
      },
      error: (error) => {
        console.error('setupSearch - Error calling SearchService searchAll:', error);
        console.error('Error en la búsqueda:', error);
        this.error = 'Error al realizar la búsqueda. Por favor, inténtalo de nuevo.';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Push a search term into the observable stream.
  search(term: string): void {
    console.log('Search function called with term:', term);
    this.searchQuery = term;
    if (term.trim()) {
      console.log('Pushing term to searchTerms subject:', term.trim());
      this.searchTerms.next(term);
    } else {
      // Si el campo de búsqueda está vacío, cargar todo el contenido
      console.log('Search term is empty, loading all content.');
      this.loadAllContent();
    }
  }

  clearSearch(): void {
    console.log('Clear search function called.');
    this.searchQuery = '';
    this.searchResults = null;
    this.error = null;
    this.setActiveTab(null);
    this.loadAllContent();
  }

  // Nueva función para limpiar filtros y búsqueda
  clearAllFiltersAndSearch(): void {
    console.log('Clear all filters and search function called.');
    this.searchQuery = '';
    this.setActiveTab(null);
    // Aquí deberías añadir lógica para limpiar cualquier otra variable de filtro si existen
    // Por ahora, solo reinicia la búsqueda
    this.loadAllContent(); // Volver a cargar el contenido inicial
  }

  // Cambiar la pestaña activa
  setActiveTab(tab: string | null): void {
    if (tab === null) {
      this.showAll = true;
      this.activeTab = null;
    } else {
      this.showAll = false;
      this.activeTab = tab;
    }
  }

  // Verificar si una pestaña está activa
  isTabActive(tab: string): boolean {
    return this.activeTab === tab;
  }

  // Verificar si se está mostrando todo
  isShowingAll(): boolean {
    return this.showAll;
  }

  playSong(song: Song): void {
    // 1. Obtener el nombre de usuario (necesario para las operaciones de cola en el backend)
    const username = this.authService.getUsername();
    if (!username) {
      console.error('User not logged in, cannot play song from explore.');
      // Opcional: mostrar un mensaje al usuario indicando que debe loggearse
      return;
    }

    // Lógica similar a song-list: limpiar cola, añadir canción, y luego reproducir
    this.playbackQueueService.clearQueue(username).subscribe({
      next: () => {
        this.playbackQueueService.addSongToQueue(username, song.id as number).subscribe({
          next: () => {
            console.log('Song added to queue, now playing:', song);
            this.playerStateService.playSong(song); // Reproducir después de añadir a la cola
          },
          error: (err) => {
            console.error('Error adding song to queue after clearing:', err);
            this.playerStateService.playSong(song); // Reproduce aunque falle la cola
          }
        });
      },
      error: (err) => {
        console.error('Error clearing queue before playing:', err);
        this.playerStateService.playSong(song); // Reproduce aunque falle limpiar la cola
      }
    });
  }

  // Método para añadir a la cola (usado por el menú contextual)
  addToQueue(song: Song): void {
    const username = this.authService.getUsername();
    const songId = song.id;
    if (!username || typeof songId !== 'number') {
      console.error('User not logged in or song ID is invalid, cannot add to queue.');
      return;
    }
    // No necesitamos indicadores de carga/éxito aquí por ahora, a diferencia de song-list
    this.playbackQueueService.addSongToQueue(username, songId).subscribe({
      next: () => {
        console.log('Song added to queue:', songId);
        // Opcional: notificar al servicio de cola si es necesario refrescar alguna UI
        this.playbackQueueService.notifyQueueUpdated();
      },
      error: (err) => {
        console.error('Error adding song to queue:', err);
        // Manejar error, quizás mostrar un mensaje al usuario
      }
    });
  }

  viewPlaylist(playlist: Playlist): void {
    // Lógica para ver detalles de la playlist en una ventana modal
    console.log('View playlist in modal:', playlist);
    this.selectedPlaylistForModal = playlist;
  }

  // Método para cerrar la ventana modal de playlist
  closePlaylistModal(): void {
    console.log('Closing playlist modal.');
    this.selectedPlaylistForModal = null;
  }

  // Cargar playlists del usuario
  private async loadUserPlaylists(): Promise<void> {
    try {
      this.loadingPlaylists = true;
      const username = this.authService.getUsername();
      if (!username) return;

      const playlists = await firstValueFrom(this.playlistService.getUserPlaylists());
      this.userPlaylists = playlists;
      console.log('User playlists loaded for context menu:', this.userPlaylists);
    } catch (error) {
      console.error('Error loading playlists for context menu:', error);
      this.contextMenuError = 'No se pudieron cargar las playlists para el menú.';
    } finally {
      this.loadingPlaylists = false;
    }
  }

  // Métodos para el menú contextual
  onSongContextMenu(event: MouseEvent, song: Song | undefined) {
    // Si no hay una canción válida, no hacemos nada
    if (!song || song.id === undefined) {
      console.warn('Cannot show context menu for invalid song.', song);
      return;
    }

    event.preventDefault();

    // Si no hay playlists y no estamos cargando, mostramos un error (para la opción de añadir a playlist)
    // La opción de añadir a la cola siempre debería estar disponible si hay una canción.
    if (this.userPlaylists.length === 0 && !this.loadingPlaylists && this.authService.isAuthenticated()) {
      // Opcional: Puedes mostrar un mensaje aquí si la ÚNICA acción del menú fuera añadir a playlist
      // Dado que también hay añadir a cola, no bloqueamos el menú completo.
       console.log('No playlists loaded for context menu.');
    }

    this.selectedSongId = song.id;
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.showContextMenu = true;

    // Posicionar el menú contextual para que no se salga de la pantalla
    // Nota: Para esto se necesita una referencia al elemento del menú en el template HTML.
    // Usaremos una lógica similar a song-list, aunque ViewChild requiere un ElementRef.
    // Podríamos necesitar una referencia similar en explore.component.html si el menú se sale.
    // Por ahora, solo configuramos la posición inicial.
    console.log('Showing context menu for song:', song.id, 'at position:', this.contextMenuPosition);
  }

  // Maneja el evento de añadir a playlist desde el menú contextual
  onAddToPlaylistHandler(event: { playlistId: number, songId: number }) {
    if (!this.authService.isAuthenticated()) {
      this.contextMenuError = 'Debes iniciar sesión para añadir canciones a playlists.';
      this.showMessage = true;
      setTimeout(() => this.showMessage = false, 4000); // Mostrar mensaje de error temporalmente
      return;
    }
    
    this.playlistService.addSongToPlaylist(event.playlistId, event.songId).subscribe({
      next: () => {
        console.debug('Song added to playlist successfully.');
        this.addToPlaylistSuccess = 'Canción añadida a la playlist con éxito.';
        this.contextMenuError = null; // Limpiar mensaje de error previo si lo hay
        this.showMessage = true;
        this.showContextMenu = false; // Cerrar el menú contextual al tener éxito
        setTimeout(() => this.showMessage = false, 3100); // Ocultar mensaje de éxito después de un tiempo
      },
      error: (err) => {
        console.error('Error al añadir canción a la playlist:', err);
        this.addToPlaylistSuccess = null; // Limpiar mensaje de éxito previo si lo hay
        // Verificar si es un error 400, que indica que la canción ya existe
        if (err.status === 400) {
          this.contextMenuError = 'La canción ya se encuentra en la playlist.';
        } else {
          this.contextMenuError = 'Error al añadir la canción a la playlist. Inténtalo de nuevo.';
        }
        this.showMessage = true; // Mostrar el mensaje de error
        this.showContextMenu = false; // Cerrar el menú contextual al tener un error
        setTimeout(() => this.showMessage = false, 4000); // Ocultar el mensaje de error después de un tiempo
      }
    });
  }

  // Maneja el evento de añadir a la cola desde el menú contextual
  onAddToQueueFromContextMenu(songId: number) {
    console.log('Handling add to queue from context menu for songId:', songId);
    // Buscar la canción por ID en la lista actual de resultados
    const song = this.searchResults?.songs.find(s => s.id === songId);
    if (!song) {
      console.error('Song not found for context menu queue action.', songId);
      return;
    }

    // Cerrar el menú después de un breve retraso para dar feedback visual (opcional)
    setTimeout(() => {
      this.showContextMenu = false;
    }, 300);

    // Llamar al método existente para añadir a la cola
    this.addToQueue(song);
  }

  // Método para cerrar el menú contextual (llamado por el componente del menú)
  onCloseContextMenu(): void {
    console.log('Closing context menu.');
    this.showContextMenu = false;
    this.selectedSongId = null; // Limpiar la canción seleccionada al cerrar
    this.contextMenuError = null; // Limpiar cualquier mensaje de error del menú
  }

  // Método para reproducir la playlist seleccionada en el modal
  playSelectedPlaylist(): void {
    if (!this.selectedPlaylistForModal || !this.selectedPlaylistForModal.songs || this.selectedPlaylistForModal.songs.length === 0) {
      console.log('No playlist selected or no songs in playlist.');
      return;
    }

    const username = this.authService.getUsername();
    if (!username) {
      console.error('User not logged in, cannot play playlist.');
      // Opcional: mostrar un mensaje al usuario indicando que debe loggearse
      return;
    }

    const songsToPlay = this.selectedPlaylistForModal.songs;
    const songIdsToPlay = songsToPlay.map(song => song.id).filter((id): id is number => id !== undefined);

    if (songIdsToPlay.length === 0) {
      console.log('No valid song IDs in the selected playlist.');
      return;
    }

    console.log('Attempting to play playlist:', this.selectedPlaylistForModal.name);

    // 1. Limpiar la cola actual
    this.playbackQueueService.clearQueue(username).subscribe({
      next: () => {
        console.log('Queue cleared. Adding songs to queue...');

        // 2. Añadir todas las canciones de la playlist a la cola en el backend
        // Usamos una cadena de suscripciones o un array de Observables si es necesario,
        // pero una simple iteración con subscribe dentro es más directa si no necesitamos esperar todas juntas.
        // Vamos a añadir una por una y luego obtener la cola.

        const addSongsSequentially = (index: number) => {
          if (index < songIdsToPlay.length) {
            const songId = songIdsToPlay[index];
            this.playbackQueueService.addSongToQueue(username, songId).subscribe({
              next: () => {
                console.log(`Song ID ${songId} added to queue. Index: ${index}`);
                // Continuar con la siguiente canción después de un breve retraso (opcional, puede ayudar con rate limits)
                setTimeout(() => addSongsSequentially(index + 1), 20); // Pequeño retraso
              },
              error: (err) => {
                console.error(`Error adding song ID ${songId} to queue:`, err);
                // Continuar con la siguiente canción incluso si falla una
                setTimeout(() => addSongsSequentially(index + 1), 20); // Pequeño retraso
              }
            });
          } else {
            console.log('All songs from playlist attempted to be added to queue.');
            // 3. Una vez que todas las canciones se han intentado añadir, obtener la cola actualizada
            this.playbackQueueService.getQueue(username).subscribe({
              next: (updatedQueue) => {
                 console.log('Fetched updated queue:', updatedQueue);
                // 4. Encontrar la primera canción en la cola obtenida y notificar al reproductor
                if (updatedQueue && updatedQueue.length > 0 && updatedQueue[0].song) {
                   console.log('Playing first song from updated queue:', updatedQueue[0].song);
                   this.playerStateService.playSong(updatedQueue[0].song); // Notificar al reproductor con la primera canción de la cola
                } else {
                   console.log('Updated queue is empty after adding songs.');
                   // Opcional: Limpiar el estado del reproductor si la cola terminó vacía
                   this.playerStateService.playSong(null);
                }
                 // Opcional: cerrar el modal o dar feedback al usuario
                 this.closePlaylistModal();
              },
              error: (err) => {
                console.error('Error fetching updated queue after adding songs:', err);
                // Opcional: mostrar un mensaje de error
              }
            });
          }
        };

        addSongsSequentially(0); // Iniciar el proceso de añadir canciones

      },
      error: (err) => {
        console.error('Error clearing queue before playing playlist:', err);
        // Manejar el error, quizás mostrando un mensaje al usuario
      }
    });
  }
}
