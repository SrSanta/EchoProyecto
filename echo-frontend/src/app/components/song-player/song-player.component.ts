import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, ViewChild, ElementRef } from "@angular/core";
import { Song } from "../../models/song.model";
import { LikeService } from "../../services/like.service";
import { AuthService } from "../../services/auth.service";
import { PlaybackQueueService } from "../../services/playback-queue.service";
import { PlayerStateService } from '../../services/player-state.service';
import { PlaybackHistoryService } from '../../services/playback-history.service';
import { CommonModule } from "@angular/common";
import { environment } from "../../../environments/environment";
import { FormsModule } from '@angular/forms';
import { PlaybackQueueComponent } from "../playback-queue/playback-queue.component";
import { User } from "../../models/user.model";

@Component({
  selector: "app-song-player",
  standalone: true,
  imports: [CommonModule, PlaybackQueueComponent, FormsModule],
  templateUrl: "./song-player.component.html",
  styleUrls: ['./song-player.component.css']
})

export class SongPlayerComponent implements OnInit, OnChanges {
  @Input() song!: Song;
  @ViewChild('audioPlayer') audioPlayerRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('videoPlayer') videoPlayerRef!: ElementRef<HTMLVideoElement>;
  
  // Player state
  isPlaying = false;
  isLiked = false;
  currentTime = '00:00';
  duration = 0;
  progressPercentage = 0;
  currentTrackNumber = 1;
  showQueue = false; // Controla si se muestra la cola de reproducción
  isLoopEnabled = false; // Controla si está activado el bucle
  isShuffleEnabled = false; // Controla si está activada la mezcla
  
  // Player state for new controls
  volume = 1.0; // Volumen inicial al máximo
  isMuted = false; // Estado de silencio
  isFullscreen = false; // Estado de pantalla completa
  
  // Propiedad para controlar la visibilidad del contenido del reproductor
  isContentVisible: boolean = true;
  
  // URLs
  audioUrl = "";
  thumbnailUrl = "";
  videoUrl = "";
  
  protected userId: number | null = null;
  
  // Media element reference (audio or video)
  private mediaElement: HTMLMediaElement | null = null;

  // Inyectar servicios necesarios
  private likeService = inject(LikeService);
  public authService = inject(AuthService);
  private playerStateService = inject(PlayerStateService);
  private playbackHistoryService = inject(PlaybackHistoryService);
  private playbackQueueService = inject(PlaybackQueueService);

  constructor() {}

  private checkIfLiked(): void {
    if (!this.userId || !this.song?.id) return;
    
    this.likeService.isSongLikedByUser(this.song.id).subscribe({
      next: (liked) => {
        this.isLiked = liked;
        console.log(`Like status for song ${this.song?.id}: ${liked}`);
      },
      error: (err) => {
        console.error('Error checking like status:', err);
        this.isLiked = false;
      }
    });
  }

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUserId();
    
    if (this.song) {
      this.initializeSong();
    }

     // Suscribirse a la canción actual para resetear la visibilidad si cambia
     this.playerStateService.currentSong$.subscribe(() => {
      this.isContentVisible = true; // Mostrar contenido al cambiar de canción
    });
  }

  private initializeSong(): void {
    if (!this.song) return;
    
    if (this.song.audioFilename) {
      this.audioUrl = `${environment.apiUrl}/api/${this.song.audioFilename}`;
    } else {
      this.audioUrl = '';
    }
    
    if (this.song.videoFilename) {
      this.videoUrl = `${environment.apiUrl}/api/${this.song.videoFilename}`;
    } else {
      this.videoUrl = '';
    }
    
    if (this.song.thumbnailFilename) {
      this.thumbnailUrl = `${environment.apiUrl}/api/${this.song.thumbnailFilename}`;
    } else {
      this.thumbnailUrl = '';
    }
    
    if (this.userId && this.song.id) {
      this.checkIfLiked();
    }
    
    // Record playback in history
    const username = this.authService.getUsername && this.authService.getUsername();
    if (username && this.song.id) {
      this.playbackHistoryService.recordPlayback(username, this.song.id).subscribe({
        error: (err) => console.error('Error recording playback:', err)
      });
    }
  }

  ngAfterViewInit() {
    this.updateMediaElementReference();
    this.tryAutoplay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['song'] && changes['song'].currentValue) {
      console.log("Song input changed:", this.song);
      this.updateMediaUrls();
      setTimeout(() => {
        this.updateMediaElementReference();
        this.tryAutoplay();
      }, 0);
      
      this.isLiked = false;

      // Registrar reproducción en historial
      const username = this.authService.getUsername && this.authService.getUsername();
      if (username && this.song && typeof this.song.id === 'number') {
        this.playbackHistoryService.recordPlayback(username, this.song.id).subscribe({
          error: (err) => {
            console.error('Error registrando reproducción en historial:', err);
          }
        });
      }

      if (this.userId !== null && this.song.id !== undefined) {
        this.likeService.isSongLikedByUser(this.song.id).subscribe({
          next: (liked) => {
            this.isLiked = liked;
            console.log(`Like status for new song ${this.song.id}: ${liked}`);
          },
          error: (err) => {
            console.error("Error checking like status:", err);
            this.isLiked = false;
          },
        });
      } else {
        console.warn(
          "SongPlayerComponent - Cannot check like status. User ID:",
          this.userId,
          "Song ID:",
          this.song?.id
        );
      }
    } else if (changes['song'] && !changes['song'].currentValue) { // When song is set to null
        this.audioUrl = "";
        this.videoUrl = "";
        this.thumbnailUrl = "";
        this.isLiked = false;
        this.stopPlayback(); // Stop playback when song is cleared
        this.mediaElement = null; // Clear media element reference
    }
  }

  private updateMediaUrls(): void {
    if (!this.song) {
      this.audioUrl = '';
      this.videoUrl = '';
      this.thumbnailUrl = '';
      return;
    }

    if (this.song.audioFilename) {
      this.audioUrl = `${environment.apiUrl}/api/${this.song.audioFilename}`;
    } else {
      this.audioUrl = '';
    }

    if (this.song.videoFilename) {
      this.videoUrl = `${environment.apiUrl}/api/${this.song.videoFilename}`;
    } else {
      this.videoUrl = '';
    }

    if (this.song.thumbnailFilename) {
      this.thumbnailUrl = `${environment.apiUrl}/api/${this.song.thumbnailFilename}`;
    } else {
      this.thumbnailUrl = '';
    }
  }

  private updateMediaElementReference(): void {
    // Set the active media element reference based on the song data
    if (this.song?.videoFilename && this.videoPlayerRef?.nativeElement) {
        this.mediaElement = this.videoPlayerRef.nativeElement;
        console.log("Using video element");
    } else if (this.song?.audioFilename && this.audioPlayerRef?.nativeElement) {
        this.mediaElement = this.audioPlayerRef.nativeElement;
        console.log("Using audio element");
    } else {
        this.mediaElement = null;
        console.log("No playable media found or elements not ready");
    }
  }

  private tryAutoplay(): void {
    if (this.mediaElement) {
      // Limpiar cualquier listener anterior para evitar múltiples reproducciones
      this.mediaElement.removeEventListener('loadedmetadata', this.playAfterLoad);

      // Asignar la URL y cargar la metadata
      // La URL ya se asigna en updateMediaUrls() y ngOnChanges
      // this.mediaElement.src = this.audioUrl || this.videoUrl;
      this.mediaElement.load();

      // Añadir listener para reproducir automáticamente después de cargar metadata
      // Usamos bind(this) para mantener el contexto correcto de la clase
      this.mediaElement.addEventListener('loadedmetadata', this.playAfterLoad);

      // Aplicar volumen inicial y estado de silencio inmediatamente
      this.mediaElement.volume = this.volume;
      this.mediaElement.muted = this.isMuted;

       // Manejar casos donde la metadata ya está cargada (por ejemplo, si el input cambia a la misma canción)
       if (this.mediaElement.readyState >= 1) { // READY_STATE.METADATA_LOADED
         this.playAfterLoad();
       }

    } else {
      console.log("No playable media found or elements not ready");
    }
  }

  // Método auxiliar para ser usado como listener
  private playAfterLoad = () => {
      if (this.mediaElement) {
        console.log('Metadata loaded, attempting to play.');
        this.mediaElement.play().catch(e => {
          console.log('Autoplay prevented or failed after metadata load:', e);
          this.playerStateService.setIsPlaying(false); // Asegurarse de que el estado sea falso si falla
        });
         // Remover el listener una vez que se dispare para evitar duplicados
         this.mediaElement.removeEventListener('loadedmetadata', this.playAfterLoad);
      }
  };

  toggleLike(): void {
    if (!this.song) {
        console.warn("No song loaded, cannot toggle like.");
        return;
    }
    if (this.userId !== null && this.song.id !== undefined) {
      const action = this.isLiked
        ? this.likeService.unlikeSong(this.song.id)
        : this.likeService.likeSong(this.song.id);
      const targetState = !this.isLiked;

      action.subscribe({
        next: () => {
          this.isLiked = targetState;
           console.log(`Song ${this.song?.id} like status toggled to: ${this.isLiked}`);
        },
        error: (err) => {
          console.error(`Error ${this.isLiked ? 'unliking' : 'liking'} song:`, err);
        },
      });
    } else {
      console.warn(
        "User not logged in or song ID missing, cannot toggle like."
      );
    }
  }

  // Format time in MM:SS format
  formatTime(seconds: number): string {
    if (isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Update progress bar and current time
  updateProgress(): void {
    if (!this.mediaElement) return;
    
    const currentTime = this.mediaElement.currentTime;
    this.currentTime = this.formatTime(currentTime);
    
    if (this.duration > 0) {
      this.progressPercentage = (currentTime / this.duration) * 100;
    }
  }
  
  // Handle metadata loaded event
  onMetadataLoaded(): void {
    if (!this.mediaElement) return;
    this.duration = this.mediaElement.duration;
    this.formattedDuration = this.formatTime(this.duration);
  }

  // Propiedad para almacenar la duración formateada
  formattedDuration: string = '00:00';

  // Obtener el tiempo de duración formateado
  get durationDisplay(): string {
    return this.formattedDuration;
  }

  // Navegar a una posición específica en la canción
  seek(event: MouseEvent): void {
    if (!this.mediaElement) return;
    
    const progressContainer = event.currentTarget as HTMLElement;
    const rect = progressContainer.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    const seekTime = pos * this.duration;
    
    this.mediaElement.currentTime = seekTime;
    this.currentTime = this.formatTime(seekTime);
    this.progressPercentage = (seekTime / this.duration) * 100;
  }

  // Retroceder 10 segundos
  seekBackward(): void {
    if (!this.mediaElement) return;
    
    const newTime = Math.max(0, this.mediaElement.currentTime - 10);
    this.mediaElement.currentTime = newTime;
    this.currentTime = this.formatTime(newTime);
    this.progressPercentage = (newTime / this.duration) * 100;
  }

  // Avanzar 10 segundos
  seekForward(): void {
    if (!this.mediaElement) return;
    
    const newTime = Math.min(this.duration, this.mediaElement.currentTime + 10);
    this.mediaElement.currentTime = newTime;
    this.currentTime = this.formatTime(newTime);
    this.progressPercentage = (newTime / this.duration) * 100;
  }
  
  // Play/Pause toggle
  playOrPause(): void {
    if (!this.mediaElement) return;
    
    if (this.isPlaying) {
      this.mediaElement.pause();
    } else {
      this.mediaElement.play().catch(e => console.log('Play prevented:', e));
    }
  }
  
  // Stop playback
  stopPlayback(): void {
    if (!this.mediaElement) return;
    
    this.mediaElement.pause();
    this.mediaElement.currentTime = 0;
    this.isPlaying = false;
    this.currentTime = '00:00';
    this.progressPercentage = 0;
  }
  
  // Eject current song
  eject(): void {
    this.stopPlayback();
    this.song = null as any;
    this.audioUrl = '';
    this.thumbnailUrl = '';
  }
  
  // Change track (for track selector)
  changeTrack(direction: number): void {
    // This is a placeholder - in a real app, this would change to the next/previous track in the queue
    // For now, we'll just update the track number display
    if (direction > 0) {
      this.currentTrackNumber = Math.min(99, this.currentTrackNumber + 1);
    } else {
      this.currentTrackNumber = Math.max(1, this.currentTrackNumber - 1);
    }
  }
  
  // Handle play event
  onPlay(): void {
    console.log('Media is playing');
    this.isPlaying = true;
    this.playerStateService.setIsPlaying(true);
  }
  
  // Handle pause event
  onPause(): void {
    console.log('Media is paused');
    this.isPlaying = false;
    this.playerStateService.setIsPlaying(false);
  }
  
  onSongEnded(): void {
    console.log('Media ended');
    this.isPlaying = false;
    if (this.isLoopEnabled) {
      // Si el bucle está activado, reproducir la misma canción de nuevo
      if (this.mediaElement) {
        this.mediaElement.currentTime = 0;
        this.mediaElement.play().catch(console.error);
        this.isPlaying = true;
      }
    } else {
      // Si no hay bucle, pasar a la siguiente canción
      this.playNext();
    }
  }

  clearQueue(): void {
    // Detenemos la reproducción
    this.stopPlayback();
    
    // Limpiamos la cola
    const username = this.authService.getUsername && this.authService.getUsername();
    if (username) {
      this.playbackQueueService.clearQueue(username).subscribe({
        next: () => {
          console.log('Queue cleared successfully');
          this.playbackQueueService.notifyQueueUpdated();
          
          // Limpiamos la canción actual del reproductor
          this.song = null as any;
          this.audioUrl = '';
          this.thumbnailUrl = '';
          this.currentTime = '00:00';
          this.progressPercentage = 0;
          this.isPlaying = false;
        },
        error: (err) => {
          console.error('Error clearing queue:', err);
        }
      });
    }
  }

  playNext(): void {
    this.authService.currentUser$.subscribe(username => {
      if (!username) return;
      this.playbackQueueService.getQueue(username.username).subscribe({
        next: (queue) => {
          if (!queue || queue.length === 0) return;
          const idx = queue.findIndex(item => item.song.id === this.song?.id);
          if (idx !== -1 && idx + 1 < queue.length) {
            const nextSong = queue[idx + 1].song;
            this.playerStateService.playSong(nextSong);
          }
        },
        error: (err) => {
          console.error('Error obteniendo la cola de reproducción:', err);
        }
      });
    });
  }

  playPrevious(): void {
    this.authService.currentUser$.subscribe(username => {
      if (!username) return;
      this.playbackQueueService.getQueue(username.username).subscribe({
        next: (queue) => {
          if (!queue || queue.length === 0) return;
          const idx = queue.findIndex(item => item.song.id === this.song?.id);
          if (idx > 0) {
            const prevSong = queue[idx - 1].song;
            this.playerStateService.playSong(prevSong);
          }
        },
        error: (err) => {
          console.error('Error obteniendo la cola de reproducción:', err);
        }
      });
    });
  }

  // Alternar el estado de bucle
  toggleLoop(): void {
    this.isLoopEnabled = !this.isLoopEnabled;
    if (this.mediaElement) {
      this.mediaElement.loop = this.isLoopEnabled;
    }
  }

  // Alternar el estado de mezcla
  toggleShuffle(): void {
    this.isShuffleEnabled = !this.isShuffleEnabled;
    if (this.isShuffleEnabled) {
      this.shuffleQueue();
    }
  }

  // Mezclar la cola de reproducción
  private shuffleQueue(): void {
    const username = this.authService.getUsername();
    if (!username) return;

    this.playbackQueueService.getQueue(username).subscribe({
      next: (queue) => {
        if (queue.length > 1) {
          // Crear una copia de la cola y mezclarla
          const shuffledQueue = [...queue];
          for (let i = shuffledQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
          }
          
          // Actualizar el orden de las canciones
          const updatedQueue = shuffledQueue.map((item, index) => ({
            ...item,
            songOrder: index
          }));
          
          // Extraer los IDs en el nuevo orden
          const songIds = updatedQueue.map(item => item.song?.id).filter((id): id is number => id !== undefined);
          
          if (songIds.length === 0) return;
          
          // Actualizar la cola en el servidor
          this.playbackQueueService.setQueue(username, songIds).subscribe({
            next: () => {
              console.log('Cola mezclada correctamente');
              // Notificar a los suscriptores que la cola ha sido actualizada
              this.playbackQueueService.notifyQueueUpdated();
            },
            error: (err: any) => console.error('Error al mezclar la cola:', err)
          });
        }
      },
      error: (err: any) => console.error('Error al obtener la cola para mezclar:', err)
    });
  }

  // New methods for volume and fullscreen

  setVolume(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.volume = parseFloat(target.value);
    if (this.mediaElement) {
      this.mediaElement.volume = this.volume;
      // Si el volumen se establece por encima de cero, desactivar el silencio
      if (this.volume > 0) {
        this.isMuted = false;
        if (this.mediaElement.muted) {
            this.mediaElement.muted = false;
        }
      }
    }
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.mediaElement) {
      this.mediaElement.muted = this.isMuted;
       // Si se activa el silencio, guardar el volumen actual para restaurar
       // Si se desactiva, restaurar el volumen guardado o al valor del slider
       // Nota: Este enfoque básico solo alterna el estado `muted`. Un enfoque más avanzado guardaría el último volumen no muteado.
    }
  }

  toggleFullscreen(): void {
    if (!this.mediaElement) return; // Solo aplicar si hay un elemento multimedia

    if (!document.fullscreenElement) {
      // Entrar en pantalla completa
      if (this.mediaElement.requestFullscreen) {
        this.mediaElement.requestFullscreen();
      } else if ((this.mediaElement as any).mozRequestFullScreen) { // Firefox
        (this.mediaElement as any).mozRequestFullScreen();
      } else if ((this.mediaElement as any).webkitRequestFullscreen) { // Chrome, Safari and Opera
        (this.mediaElement as any).webkitRequestFullscreen();
      } else if ((this.mediaElement as any).msRequestFullscreen) { // IE/Edge
        (this.mediaElement as any).msRequestFullscreen();
      }
      this.isFullscreen = true;
    } else {
      // Salir de pantalla completa
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).mozCancelFullScreen) { // Firefox
        (document as any).mozCancelFullScreen();
      } else if ((document as any).webkitExitFullscreen) { // Chrome, Safari and Opera
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) { // IE/Edge
        (document as any).msExitFullscreen();
      }
      this.isFullscreen = false;
    }
  }

  // Método para alternar la visibilidad del contenido del reproductor
  toggleContentVisibility(): void {
    this.isContentVisible = !this.isContentVisible;
  }
}
