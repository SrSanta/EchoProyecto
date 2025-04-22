import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { SongService } from '../../services/song.service';
import { GenreService } from '../../services/genre.service';
import { Genre } from '../../models/genre.model';

const MAX_SIZE_BYTES = 10 * 1024 * 1024 * 1024;


@Component({
  selector: 'app-song-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './song-upload.component.html',
})
export class SongUploadComponent implements OnInit {
  songTitle: string = '';
  selectedFile: File | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;
  genres$: Observable<Genre[]> | undefined;
  selectedGenreId: string = '';

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
      if (file.size > MAX_SIZE_BYTES) {
        this.errorMessage = `El archivo es demasiado grande. El tamaño máximo es ${MAX_SIZE_BYTES / 1024 / 1024} MB.`;
        this.selectedFile = null;
        // Limpia visualmente el input si es necesario
        element.value = '';
      } else {
        this.selectedFile = file;
        this.errorMessage = null;
      }
    } else {
      this.selectedFile = null;
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

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);
    formData.append('title', this.songTitle.trim());
    formData.append('genreId', this.selectedGenreId);

    this.songService.uploadSong(formData).subscribe({
      next: (savedSong) => {
        this.isLoading = false;
        this.successMessage = `¡Canción "${savedSong.title}" subida con éxito!`;
        console.log('Canción guardada:', savedSong);
        this.songTitle = '';
        this.selectedFile = null;
        this.selectedGenreId = '';
        const fileInput = document.getElementById('songFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al subir la canción:', error);
        this.errorMessage = error.error?.message || error.error || error.message || 'Ocurrió un error al subir la canción.';
      }
    });
  }
}
