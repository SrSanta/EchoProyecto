import { Component, Input, OnInit, inject } from "@angular/core";
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
  // styleUrls: ['./song-player.component.css']
})
export class SongPlayerComponent implements OnInit {
  @Input() song!: Song;
  isLiked = false;
  audioUrl = "";
  private userId: number | null = null;

  private likeService = inject(LikeService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUserId();

    if (this.song) {
      this.audioUrl = `${environment.apiUrl}/audio/${this.song.audioFilename}`;

      if (this.userId !== null && this.song.id !== undefined) {
        this.likeService.isSongLikedByUser(this.song.id).subscribe({
          next: (liked) => {
            this.isLiked = liked;
          },
          error: (err) => {
            console.error("Error checking like status:", err);
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
    }
  }

  toggleLike(): void {
    if (this.userId !== null && this.song.id !== undefined) {
      if (this.isLiked) {
        this.likeService.unlikeSong(this.song.id).subscribe({
          next: () => {
            this.isLiked = false;
          },
          error: (err) => {
            console.error("Error unliking song:", err);
          },
        });
      } else {
        this.likeService.likeSong(this.song.id).subscribe({
          next: () => {
            this.isLiked = true;
          },
          error: (err) => {
            console.error("Error liking song:", err);
          },
        });
      }
    } else {
      console.warn(
        "User not logged in or song ID missing, cannot toggle like."
      );
    }
  }
}
