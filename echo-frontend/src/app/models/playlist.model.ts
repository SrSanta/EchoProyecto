import { User } from './user.model';

import { Song } from './song.model';

export interface Playlist {
  id?: number;
  name: string;
  user: User;
  userId?: number;
  isPublic?: boolean;
  followed?: boolean;
  favorite?: boolean;
  creationDate?: string;
  songs?: Song[];
  // Para mostrar enlace público
  publicUrl?: string;
}
