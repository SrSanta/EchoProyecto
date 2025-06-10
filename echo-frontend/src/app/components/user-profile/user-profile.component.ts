import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { UserProfileEditComponent } from '../user-profile-edit/user-profile-edit.component';
import { PlaylistsPageComponent } from '../playlists/playlists-page.component';
import { HttpClientModule } from '@angular/common/http';
import { UserUploadedSongsComponent } from '../user-uploaded-songs/user-uploaded-songs.component';
import { SongService } from '../../services/song.service';
import { LikeService } from '../../services/like.service';
import { Song } from '../../models/song.model';
import { PlayerStateService } from '../../services/player-state.service';
import { PlaybackQueueService } from '../../services/playback-queue.service';
import { PlaybackManagerService } from '../../services/playback-manager.service';
import { Subject, throwError } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, UserProfileEditComponent, PlaylistsPageComponent, UserUploadedSongsComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  editMode = false;
  showPlaylists = false;
  showLikedSongs = false;
  user: any = null;
  loading = true;
  error: string | null = null;
  selectedFile: File | null = null;
  uploading = false;
  likedSongs: Song[] = [];
  loadingLikedSongs = false;
  likedSongsError: string | null = null;
  protected environment = environment;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private songService: SongService,
    private likeService: LikeService,
    private playerStateService: PlayerStateService,
    private playbackQueueService: PlaybackQueueService,
    public playbackManagerService: PlaybackManagerService,
    private route: ActivatedRoute
  ) {}

  toggleEditMode() {
    this.editMode = !this.editMode;
    this.showPlaylists = false;
    this.showLikedSongs = false;
  }

  togglePlaylists() {
    this.showPlaylists = !this.showPlaylists;
    if (this.showPlaylists) {
      this.editMode = false;
      this.showLikedSongs = false;
    }
  }

  toggleLikedSongs() {
    this.showLikedSongs = !this.showLikedSongs;
    if (this.showLikedSongs) {
      this.editMode = false;
      this.showPlaylists = false;
      this.loadLikedSongs();
    }
  }

  loadLikedSongs(): void {
    if (!this.user || !this.user.id) {
      this.likedSongsError = 'User not loaded or user ID is missing.';
      return;
    }

    this.loadingLikedSongs = true;
    this.likedSongsError = null;
    this.likedSongs = [];

    this.likeService.getLikedSongs(this.user.id).subscribe({
      next: (songIds: number[]) => {
        if (songIds.length === 0) {
          this.likedSongsError = 'No liked songs found.';
          this.loadingLikedSongs = false;
          return;
        }

        let loadedSongs: Song[] = [];
        let completedFetches = 0;

        songIds.forEach(id => {
          this.songService.getSongById(id).subscribe({
            next: (song) => {
              if (song) {
                loadedSongs.push(song);
              }
              completedFetches++;
              if (completedFetches === songIds.length) {
                this.likedSongs = loadedSongs;
                this.loadingLikedSongs = false;
                if (loadedSongs.length < songIds.length) {
                  this.likedSongsError = 'Some liked songs could not be loaded.';
                } else {
                  this.likedSongsError = null;
                }
              }
            },
            error: (err) => {
              console.error(`Error loading song ${id}:`, err);
              completedFetches++;
              if (completedFetches === songIds.length) {
                this.likedSongs = loadedSongs;
                this.loadingLikedSongs = false;
                if (loadedSongs.length < songIds.length && this.likedSongsError === null) {
                  this.likedSongsError = 'Some liked songs could not be loaded.';
                }
              }
            }
          });
        });
      },
      error: (err) => {
        this.likedSongsError = err.error?.message || err.message || 'Error al cargar las canciones favoritas.';
        this.loadingLikedSongs = false;
        console.error('Error loading liked song IDs:', err);
      }
    });
  }

  ngOnInit(): void {
    this.fetchUser().subscribe({
      next: () => {
        this.route.queryParams.pipe(
          takeUntil(this.destroy$)
        ).subscribe(params => {
          this.resetViewFlags();
          if (params['view'] === 'liked-songs') {
            this.showLikedSongs = true;
            this.loadLikedSongs();
          } else if (params['view'] === 'playlists') {
            this.showPlaylists = true;
          } else if (params['view'] === 'edit') {
            this.editMode = true;
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar el usuario para el perfil:', err);
      }
    });
  }

  private resetViewFlags(): void {
    this.editMode = false;
    this.showPlaylists = false;
    this.showLikedSongs = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchUser() {
    this.loading = true;
    return this.http.get(`${environment.apiUrl}/api/users/me`).pipe(
      map((user: any) => {
        this.user = user;
        this.loading = false;
        return user;
      }),
      catchError((err: HttpErrorResponse) => {
        this.error = err.error?.message || err.message || 'Error al cargar el perfil';
        this.loading = false;
        return throwError(() => err);
      })
    );
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  uploadProfileImage() {
    if (!this.selectedFile || !this.user) return;
    this.uploading = true;
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    this.http.put(`${environment.apiUrl}/users/${this.user.id}/profile-image`, formData).subscribe({
      next: (filename: any) => {
        this.user.profileImage = filename;
        this.uploading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || err.message || 'Error al subir la imagen';
        this.uploading = false;
      }
    });
  }

  getProfileImageUrl(): string {
    if (this.user && this.user.profileImage) {
      return `${environment.apiUrl}/api/users/profile-image/${this.user.profileImage}`;
    }
    return 'https://ui-avatars.com/api/?name=' + (this.user?.username || 'U') + '&background=cccccc&color=333333&size=128';
  }
}
