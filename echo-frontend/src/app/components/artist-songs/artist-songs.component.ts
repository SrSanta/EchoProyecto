import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Song } from '../../models/song.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-artist-songs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './artist-songs.component.html',
  styleUrls: ['./artist-songs.component.css']
})
export class ArtistSongsComponent {
  @Input() songs: Song[] = [];

  // No need for loading, error, artistUsername, or SongService injection
  // as the songs are now passed in via @Input

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