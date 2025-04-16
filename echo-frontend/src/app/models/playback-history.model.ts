import { User } from './user.model';
import { Song } from './song.model';

export interface PlaybackHistory {
  user: User;
  song: Song;
  playbackTimestamp: string;
}
