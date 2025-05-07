import { Genre } from './genre.model';
import { User } from './user.model';

export interface Song {
  id?: number;
  title: string;
  genre: Genre;
  user: User;
  audioFilename?: string;
  videoFilename?: string;
  thumbnailFilename?: string;
  album?: string;
  releaseYear?: number;
  tags?: string[];
  uploadDate?: string;
}
