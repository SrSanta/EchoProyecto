import { Component, Input, OnInit } from "@angular/core";
import { Song } from "../../models/song.model";
import { LikeService } from "../../services/like.service";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-song-player",
  templateUrl: "./song-player.component.html",
})
export class SongPlayerComponent implements OnInit {
  @Input() song!: Song;
  isLiked = false;
  audioUrl = "";

  constructor(
    private likeService: LikeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.song) {
      this.audioUrl = `http://localhost:8080/audio/${this.song.audioFilename}`;
      const userId = this.authService.getCurrentUserId();
      if (userId !== null && this.song.id !== undefined) {
        this.likeService
          .isSongLikedByUser(userId, this.song.id)
          .subscribe((liked) => {
            this.isLiked = liked;
          });
      }
    }
  }

  toggleLike(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId != null && this.song.id !== undefined) {
      if (this.isLiked) {
        this.likeService.unlikeSong(userId, this.song.id).subscribe(() => {
          this.isLiked = false;
        });
      } else {
        this.likeService.likeSong(userId, this.song.id).subscribe(() => {
          this.isLiked = true;
        });
      }
    }
  }
}
