import { Component, OnInit } from '@angular/core';
import { SongService } from './../../services/song.service';
import { Song } from './../../models/song.model';

@Component({
  selector: 'app-song-list',
  standalone: true,
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.css'],
})
export class SongListComponent implements OnInit {
  songs: Song[] = [];
  loading = true;
  error: string | null = null;

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
}
