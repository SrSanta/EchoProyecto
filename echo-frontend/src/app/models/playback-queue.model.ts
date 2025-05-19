import { Song } from './song.model';

export interface PlaybackQueue {
  id: number;
  song: Song;
  songOrder: number;
}
