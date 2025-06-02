import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SongService } from '../../services/song.service';
import { Song } from '../../models/song.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-artist-songs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './artist-songs.component.html',
  styleUrls: ['./artist-songs.component.css']
})
export class ArtistSongsComponent implements OnInit, OnChanges {
  @Input() artistUsername: string | null = null;

  songs: Song[] = [];
  loading = false;
  error: string | null = null;

  private songService = inject(SongService);

  constructor() { }

  ngOnInit(): void {
    // La carga inicial se manejará en ngOnChanges cuando se reciba el artistUsername
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['artistUsername'] && this.artistUsername) {
      this.loadArtistSongs(this.artistUsername);
    } else if (changes['artistUsername'] && !this.artistUsername) {
      // Limpiar si el username se vuelve nulo
      this.songs = [];
      this.loading = false;
      this.error = null;
    }
  }

  loadArtistSongs(username: string): void {
    this.loading = true;
    this.error = null;
    
    this.songService.getSongsByUsername(username).subscribe({
      next: (data) => {
        this.songs = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error loading artist songs.';
        this.loading = false;
        console.error('Error loading artist songs:', err);
      }
    });
  }

  getSongUrl(songFilename: string | undefined): string {
    if (!songFilename) return '';
    // Asumiendo que los archivos de audio están en /api/audio/ en el backend
    return `${environment.apiUrl}/api/audio/${songFilename}`;
  }

  getThumbnailUrl(thumbnailFilename: string | undefined): string {
    if (!thumbnailFilename) return '';
    // Asumiendo que las miniaturas están en /api/thumbnails/ en el backend
    return `${environment.apiUrl}/api/thumbnails/${thumbnailFilename}`;
  }
} 