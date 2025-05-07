import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { SongService } from '../../services/song.service';
import { GenreService } from '../../services/genre.service';
import { Genre } from '../../models/genre.model';

const MAX_AUDIO_VIDEO_SIZE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB for audio/video
const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB for thumbnail

@Component({
  selector: 'app-song-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './song-upload.component.html',
  styleUrls: ['./song-upload.component.css'] // Optional: if you add styles
})
export class SongUploadComponent implements OnInit {
  songTitle: string = '';
  selectedFile: File | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;
  genres$: Observable<Genre[]> | undefined;
  selectedGenreId: string = '';
  selectedThumbnailFile: File | null = null;
  selectedVideoFile: File | null = null;
  songReleaseYear: number | null = null;
  currentYear: number = new Date().getFullYear();

  private songService = inject(SongService);
  private genreService = inject(GenreService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadGenres();
  }

  loadGenres(): void {
    this.genres$ = this.genreService.getAllGenres();
    this.genres$.subscribe({
       error: err => {
           console.error("Error loading genres:", err);
           this.errorMessage = "No se pudieron cargar los géneros. Inténtalo de nuevo.";
       }
    });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      if (file.size > MAX_AUDIO_VIDEO_SIZE_BYTES) {
        this.errorMessage = `El archivo de audio es demasiado grande. El tamaño máximo es ${MAX_AUDIO_VIDEO_SIZE_BYTES / 1024 / 1024 / 1024} GB.`;
        this.selectedFile = null;
        element.value = ''; // Clear the input
      } else {
        this.selectedFile = file;
        this.errorMessage = null;
      }
    } else {
      this.selectedFile = null;
    }
  }

  onThumbnailSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      if (file.size > MAX_THUMBNAIL_SIZE_BYTES) {
        this.errorMessage = `La imagen de portada es demasiado grande. El tamaño máximo es ${MAX_THUMBNAIL_SIZE_BYTES / 1024 / 1024} MB.`;
        this.selectedThumbnailFile = null;
        element.value = ''; // Clear the input
      } else if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Por favor, selecciona un archivo de imagen para la portada (ej: JPG, PNG).';
        this.selectedThumbnailFile = null;
        element.value = '';
      } else {
        this.selectedThumbnailFile = file;
        this.errorMessage = null;
      }
    } else {
      this.selectedThumbnailFile = null;
    }
  }

  onVideoSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      if (file.size > MAX_AUDIO_VIDEO_SIZE_BYTES) {
        this.errorMessage = `El archivo de video es demasiado grande. El tamaño máximo es ${MAX_AUDIO_VIDEO_SIZE_BYTES / 1024 / 1024 / 1024} GB.`;
        this.selectedVideoFile = null;
        element.value = '';
      } else {
        this.selectedVideoFile = file;
        this.errorMessage = null;
      }
    } else {
      this.selectedVideoFile = null;
    }
  }

  onSubmit(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Por favor, selecciona un archivo de audio.';
      return;
    }
    if (!this.songTitle.trim()) {
      this.errorMessage = 'Por favor, introduce un título para la canción.';
      return;
    }
    if (!this.selectedGenreId) {
        this.errorMessage = 'Por favor, selecciona un género para la canción.';
        return;
    }
    if (!this.selectedThumbnailFile) {
      this.errorMessage = 'Por favor, selecciona una imagen de portada para la canción.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);
    formData.append('title', this.songTitle.trim());
    formData.append('genreId', this.selectedGenreId);
    formData.append('thumbnailFile', this.selectedThumbnailFile, this.selectedThumbnailFile.name);
    if (this.selectedVideoFile) {
      formData.append('videoFile', this.selectedVideoFile, this.selectedVideoFile.name);
    }
    if (this.songReleaseYear !== null && this.songReleaseYear !== undefined) {
      formData.append('releaseYear', this.songReleaseYear.toString());
    }

    this.songService.uploadSong(formData).subscribe({
      next: (savedSong) => {
        this.isLoading = false;
        this.successMessage = `¡Canción "${savedSong.title}" subida con éxito!`;
        console.log('Canción guardada:', savedSong);
        this.songTitle = '';
        this.selectedFile = null;
        this.selectedThumbnailFile = null;
        this.selectedVideoFile = null;
        this.selectedGenreId = '';
        this.songReleaseYear = null;
        const fileInput = document.getElementById('songFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        const thumbnailInput = document.getElementById('songThumbnail') as HTMLInputElement;
        if (thumbnailInput) thumbnailInput.value = '';
        const videoInput = document.getElementById('songVideo') as HTMLInputElement;
        if (videoInput) videoInput.value = '';
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al subir la canción:', error);
        this.errorMessage = error.error?.message || error.error || error.message || 'Ocurrió un error al subir la canción.';
      }
    });
  }
}
