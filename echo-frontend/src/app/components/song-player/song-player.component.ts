import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from "@angular/core";
import { Song } from "../../models/song.model";
import { LikeService } from "../../services/like.service";
import { AuthService } from "../../services/auth.service";
import { PlaybackQueueService } from "../../services/playback-queue.service";
import { PlayerStateService } from '../../services/player-state.service';
import { CommonModule } from "@angular/common";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-song-player",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./song-player.component.html",
  styleUrls: ['./song-player.component.css']
})

export class SongPlayerComponent implements OnInit, OnChanges {
  @Input() song!: Song;
  isLiked = false;
  audioUrl = "";
  thumbnailUrl = "";
  protected userId: number | null = null;

  private likeService = inject(LikeService);
  private authService = inject(AuthService);
  private playbackQueueService = inject(PlaybackQueueService);
  private playerStateService = inject(PlayerStateService);

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUserId();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['song'] && changes['song'].currentValue) {
      console.log("Song input changed:", this.song);
      if (this.song && this.song.audioFilename) {
        this.audioUrl = `${environment.apiUrl}/audio/${this.song.audioFilename}`;
      } else {
        this.audioUrl = '';
      }
      if (this.song && this.song.thumbnailFilename) {
        this.thumbnailUrl = `${environment.apiUrl}/audio/${this.song.thumbnailFilename}`;
      }
      this.isLiked = false;

      if (this.userId !== null && this.song.id !== undefined) {
        this.likeService.isSongLikedByUser(this.song.id).subscribe({
          next: (liked) => {
            this.isLiked = liked;
            console.log(`Like status for new song ${this.song.id}: ${liked}`);
          },
          error: (err) => {
            console.error("Error checking like status:", err);
            this.isLiked = false;
          },
        });
      } else {
        console.warn(
          "SongPlayerComponent - Cannot check like status. User ID:",
          this.userId,
          "Song ID:",
          this.song?.id
        );
      }
    } else if (changes['song'] && !changes['song'].currentValue) {
        this.audioUrl = "";
        this.thumbnailUrl = "";
        this.isLiked = false;
    }
  }

  toggleLike(): void {
    if (!this.song) {
        console.warn("No song loaded, cannot toggle like.");
        return;
    }
    if (this.userId !== null && this.song.id !== undefined) {
      const action = this.isLiked
        ? this.likeService.unlikeSong(this.song.id)
        : this.likeService.likeSong(this.song.id);
      const targetState = !this.isLiked;

      action.subscribe({
        next: () => {
          this.isLiked = targetState;
           console.log(`Song ${this.song?.id} like status toggled to: ${this.isLiked}`);
        },
        error: (err) => {
          console.error(`Error ${this.isLiked ? 'unliking' : 'liking'} song:`, err);
        },
      });
    } else {
      console.warn(
        "User not logged in or song ID missing, cannot toggle like."
      );
    }
  }

  onSongEnded(): void {
    this.playNext();
  }

  playNext(): void {
    this.authService.currentUser$.subscribe(username => {
      if (!username) return;
      this.playbackQueueService.getQueue(username).subscribe({
        next: (queue) => {
          if (!queue || queue.length === 0) return;
          const idx = queue.findIndex(item => item.song.id === this.song?.id);
          if (idx !== -1 && idx + 1 < queue.length) {
            const nextSong = queue[idx + 1].song;
            this.playerStateService.playSong(nextSong);
          }
        },
        error: (err) => {
          console.error('Error obteniendo la cola de reproducción:', err);
        }
      });
    });
  }

  playPrevious(): void {
    this.authService.currentUser$.subscribe(username => {
      if (!username) return;
      this.playbackQueueService.getQueue(username).subscribe({
        next: (queue) => {
          if (!queue || queue.length === 0) return;
          const idx = queue.findIndex(item => item.song.id === this.song?.id);
          if (idx > 0) {
            const prevSong = queue[idx - 1].song;
            this.playerStateService.playSong(prevSong);
          }
        },
        error: (err) => {
          console.error('Error obteniendo la cola de reproducción:', err);
        }
      });
    });
  }
}

