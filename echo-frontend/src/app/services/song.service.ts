// src/app/services/song.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Song } from '../models/song.model';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SongService {
  private apiUrl = `${environment.apiUrl}/api/songs`;

  constructor(private http: HttpClient) {}

  uploadSong(formData: FormData): Observable<Song> {
    return this.http.post<Song>(`${this.apiUrl}/upload`, formData);
  }

  getAllSongs(): Observable<Song[]> {
    return this.http.get<Song[]>(this.apiUrl);
  }

  getSongById(id: number): Observable<Song> {
    return this.http.get<Song>(`${this.apiUrl}/${id}`);
  }

  searchSongs(params: { genre?: string; artist?: string; title?: string }): Observable<Song[]> {
    const cleanParams: { [key: string]: string } = {};
    for (const key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = value;
        }
      }
    }
    const query = new URLSearchParams(cleanParams).toString();
    return this.http.get<Song[]>(`${this.apiUrl}/search?${query}`);
  }


  // deleteSong(id: number): Observable<void> {
  //   return this.http.delete<void>(`${this.apiUrl}/${id}`);
  // }
  
  // updateSongMetadata(id: number, songData: Partial<Song>): Observable<Song> {
  //   // Asegúrate de enviar solo los campos permitidos para actualizar
  //   const updatePayload = { title: songData.title, genre: songData.genre /* otros */ };
  //   return this.http.put<Song>(`${this.apiUrl}/${id}`, updatePayload);
  // }
}
