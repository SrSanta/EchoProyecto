import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Genre } from '../models/genre.model';

@Injectable({
  providedIn: 'root'
})
export class GenreService {
  private apiUrl = `${environment.apiUrl}/api/genres`;

  constructor(private http: HttpClient) {}

  getAllGenres(): Observable<Genre[]> {
    return this.http.get<Genre[]>(this.apiUrl);
  }
}
