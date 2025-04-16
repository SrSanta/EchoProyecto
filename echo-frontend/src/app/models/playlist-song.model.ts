import { Playlist } from './playlist.model';
import { Song } from './song.model';

export interface PlaylistSong {
  playlist: Playlist;
  song: Song;
  songOrder: number;
}
