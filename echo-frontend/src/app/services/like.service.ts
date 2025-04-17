import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LikeService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  likeSong(userId: number, songId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/likes`, { userId, songId });
  }

  unlikeSong(userId: number, songId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/likes/${userId}/${songId}`);
  }

  isSongLikedByUser(userId: number, songId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/likes/${userId}/${songId}/liked`);
  }

  getLikedSongs(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/likes/user/${userId}`);
  }

  getLikeCount(songId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/likes/song/${songId}/count`);
  }
}
