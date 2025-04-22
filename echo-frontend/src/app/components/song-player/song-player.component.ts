import { Component, Input, OnInit, OnChanges, SimpleChanges, inject} from "@angular/core";
import { Song } from "../../models/song.model";
import { LikeService } from "../../services/like.service";
import { AuthService } from "../../services/auth.service";
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
  protected userId: number | null = null;

  private likeService = inject(LikeService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUserId();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['song'] && changes['song'].currentValue) {
      console.log("Song input changed:", this.song);
      this.audioUrl = `${environment.apiUrl}/audio/${this.song.audioFilename}`;
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
}
