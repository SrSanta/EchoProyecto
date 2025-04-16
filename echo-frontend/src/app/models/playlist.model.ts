import { User } from './user.model';

export interface Playlist {
  id?: number;
  name: string;
  user: User;
  creationDate?: string;
}
