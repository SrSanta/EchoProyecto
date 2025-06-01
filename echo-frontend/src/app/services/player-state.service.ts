import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Song } from '../models/song.model';

@Injectable({
  providedIn: 'root'
})
export class PlayerStateService {
  private currentSongSource = new BehaviorSubject<Song | null>(null);
  currentSong$: Observable<Song | null> = this.currentSongSource.asObservable();

  private isPlayingSource = new BehaviorSubject<boolean>(false);
  isPlaying$: Observable<boolean> = this.isPlayingSource.asObservable();

  constructor() { }

  playSong(song: Song | null): void {
    this.currentSongSource.next(song);
  }

  setIsPlaying(isPlaying: boolean): void {
    this.isPlayingSource.next(isPlaying);
  }
}