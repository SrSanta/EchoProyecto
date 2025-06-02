import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SongService } from '../../services/song.service';
import { PlaylistService } from '../../services/playlist.service';
import { User } from '../../models/user.model';
import { Song } from '../../models/song.model';
import { Playlist } from '../../models/playlist.model';
import { forkJoin } from 'rxjs';
import { ArtistSongsComponent } from '../artist-songs/artist-songs.component';
import { ArtistPlaylistsComponent } from '../artist-playlists/artist-playlists.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-artist-profile',
  standalone: true,
  imports: [CommonModule, ArtistSongsComponent, ArtistPlaylistsComponent],
  templateUrl: './artist-profile.component.html',
  styleUrls: ['./artist-profile.component.css']
})
export class ArtistProfileComponent implements OnInit {
  artistUsername: string | null = null;
  artist: User | null = null;
  songs: Song[] = [];
  playlists: Playlist[] = [];
  loading = true;
  error: string | null = null;

  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private songService = inject(SongService);
  private playlistService = inject(PlaylistService);

  constructor() { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.artistUsername = params.get('username');
      if (this.artistUsername) {
        this.loadArtistProfile(this.artistUsername);
      } else {
        this.error = 'No username provided in route.';
        this.loading = false;
      }
    });
  }

  loadArtistProfile(username: string): void {
    this.loading = true;
    this.error = null;

    this.userService.getUserByUsername(username).subscribe({
      next: (artist) => {
        this.artist = artist;
        this.loading = false;

        if (!this.artist) {
            this.error = 'Artist not found.';
        }
      },
      error: (err) => {
        this.error = 'Error loading artist profile.';
        this.loading = false;
        console.error('Error loading artist profile:', err);
      }
    });
  }

  getProfileImageUrl(): string {
    if (this.artist && this.artist.profileImage) {
        return `${environment.apiUrl}/${this.artist.profileImage}`;
    }
    return 'https://ui-avatars.com/api/?name=' + (this.artist?.username || 'U') + '&background=cccccc&color=333333&size=128';
  }
} 