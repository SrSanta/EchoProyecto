import { Component, OnInit, inject } from '@angular/core'; // inject puede quedarse si se usa para inicializar propiedades directamente
import { SongService } from './../../services/song.service';
import { Song } from './../../models/song.model';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { PlayerStateService } from '../../services/player-state.service'; // Importar el nuevo servicio

@Component({
  selector: 'app-song-list',
  standalone: true,
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.css'],
  imports: [CommonModule], // SongPlayerComponent ya no se importa aquí
})
export class SongListComponent implements OnInit {
  songs: Song[] = [];
  loading = true;
  error: string | null = null;
  protected environment = environment;

  // Inyección de dependencias estándar a través del constructor
  constructor(
    private songService: SongService,
    private playerStateService: PlayerStateService
  ) {}

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
    this.playerStateService.playSong(song);
  }
}
