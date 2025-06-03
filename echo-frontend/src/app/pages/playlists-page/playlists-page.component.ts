import { PlaylistService } from '../../services/playlist.service';
import { AuthService } from '../../services/auth.service';
import { SongService } from '../../services/song.service';

class PlaylistsPageComponent {
  togglePublic(playlist: Playlist): void {
    console.log('Intentando alternar visibilidad:');
    console.log('isOwner:', this.isOwner);
    console.log('Objeto Playlist:', playlist);

    if (!this.isOwner) {
      // ... existing code ...
    }
  }
} 