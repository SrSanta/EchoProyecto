import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaylistService } from '../../services/playlist.service';
import { Playlist } from '../../models/playlist.model'; // Usaremos Playlist ya que el endpoint devuelve el modelo completo

@Component({
  selector: 'app-artist-playlists',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './artist-playlists.component.html',
  styleUrls: ['./artist-playlists.component.css']
})
export class ArtistPlaylistsComponent implements OnInit, OnChanges {
  @Input() artistUsername: string | null = null;

  playlists: Playlist[] = [];
  loading = false;
  error: string | null = null;

  private playlistService = inject(PlaylistService);

  constructor() { }

  ngOnInit(): void {
    // La carga inicial se manejará en ngOnChanges cuando se reciba el artistUsername
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['artistUsername'] && this.artistUsername) {
      this.loadArtistPlaylists(this.artistUsername);
    } else if (changes['artistUsername'] && !this.artistUsername) {
      // Limpiar si el username se vuelve nulo
      this.playlists = [];
      this.loading = false;
      this.error = null;
    }
  }

  loadArtistPlaylists(username: string): void {
    this.loading = true;
    this.error = null;

    this.playlistService.getPublicPlaylistsByUsername(username).subscribe({
      next: (data) => {
        this.playlists = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error loading artist playlists.';
        this.loading = false;
        console.error('Error loading artist playlists:', err);
      }
    });
  }
} 