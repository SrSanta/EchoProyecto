import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { SearchService } from '../../services/search.service';
import { Song } from '../../models/song.model';
import { Playlist } from '../../models/playlist.model';
import { PlayerStateService } from '../../services/player-state.service';
import { environment } from '../../../environments/environment';
import { PlaybackQueueService } from '../../services/playback-queue.service';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent implements OnInit, OnDestroy {
  private searchService = inject(SearchService);
  private playerStateService = inject(PlayerStateService);
  private playbackQueueService = inject(PlaybackQueueService);
  private router = inject(Router);
  
  searchQuery: string = '';
  searchResults: { songs: Song[]; playlists: Playlist[]; artists: any[] } | null = null;
  loading: boolean = false;
  error: string | null = null;
  environment = environment;
  
  private searchTerms = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Remove duplicate constructor since we're using inject()

  ngOnInit(): void {
    this.searchTerms.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(term => {
        this.loading = true;
        this.error = null;
        return this.searchService.searchAll(term);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.loading = false;
      },
      error: (error) => {
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
    this.searchQuery = term;
    if (term.trim()) {
      this.searchTerms.next(term);
    } else {
      this.searchResults = null;
      this.error = null;
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = null;
    this.error = null;
  }

  playSong(song: Song): void {
    this.playerStateService.playSong(song);
  }

  addToQueue(song: Song, event: Event): void {
    event.stopPropagation();
    this.playbackQueueService.addToQueue(song);
  }

  viewPlaylist(playlist: Playlist): void {
    if (playlist.id) {
      this.router.navigate(['/playlist', playlist.id]);
    }
  }

  viewArtist(artist: any): void {
    if (artist.id) {
      this.router.navigate(['/artist', artist.id]);
    }
  }
}
