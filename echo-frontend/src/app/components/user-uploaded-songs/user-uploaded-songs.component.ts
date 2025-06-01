import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SongService } from '../../services/song.service'; // Assuming SongService is in services folder
import { Song } from '../../models/song.model'; // Assuming Song model is in models folder

@Component({
  selector: 'app-user-uploaded-songs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-uploaded-songs.component.html',
  styleUrls: ['./user-uploaded-songs.component.css']
})
export class UserUploadedSongsComponent implements OnInit {

  songs: Song[] = [];
  loading = true;
  error: string | null = null;
  private songService = inject(SongService);

  constructor() { }

  ngOnInit(): void {
    this.loadUserSongs();
  }

  loadUserSongs(): void {
    this.loading = true;
    this.error = null;
    // TODO: Call the backend endpoint to get songs for the authenticated user
    this.songService.getUserSongs().subscribe({
      next: (data) => {
        this.songs = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error loading user songs.';
        this.loading = false;
        console.error('Error loading user songs:', err);
      }
    });
    // Placeholder for now:
  }

  deleteSong(songId: number): void {
    // TODO: Implement song deletion logic
    console.log('Delete song:', songId);
    this.songService.deleteSong(songId).subscribe({
      next: () => {
        // Remove song from the list after successful deletion
        this.songs = this.songs.filter(song => song.id !== songId);
        // Show success message (Optional: implement a notification service)
        console.log(`Song with ID ${songId} deleted successfully.`);
      },
      error: (err) => {
        this.error = 'Error deleting song.';
        console.error('Error deleting song:', err);
        // Show error message (Optional: implement a notification service)
      }
    });
  }
} 