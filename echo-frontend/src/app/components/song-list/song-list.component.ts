import { Component, OnInit } from '@angular/core';
import { SongService } from './../../services/song.service';
import { Song } from './../../models/song.model';
import { SongPlayerComponent } from '../song-player/song-player.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-song-list',
  standalone: true,
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.css'],
  imports: [CommonModule, SongPlayerComponent],
})
export class SongListComponent implements OnInit {
  songs: Song[] = [];
  loading = true;
  error: string | null = null;
  selectedSong: Song | null = null;

  constructor(private songService: SongService) {}

  ngOnInit(): void {
    this.songService.getAllSongs().subscribe({
      next: (data) => {
        this.songs = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se pudieron cargar las canciones.';
        this.loading = false;
      },
    });
  }

  playSong(song: Song) {
    this.selectedSong = song;
  }
}
