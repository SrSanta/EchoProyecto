import { User } from './user.model';
import { Song } from './song.model';

export interface Like {
  user: User;
  song: Song;
  likeTimestamp?: string;
}
