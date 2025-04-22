import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LikeService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  likeSong(songId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/likes`, { songId });
  }

  unlikeSong(songId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/likes/${songId}`);
  }

  isSongLikedByUser(songId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/likes/songs/${songId}/liked`);
  }

  getLikedSongs(userId: number): Observable<number[]> {
     return this.http.get<number[]>(`${this.apiUrl}/likes/users/me`);
  }


  getLikeCount(songId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/likes/songs/${songId}/count`);
  }
}
