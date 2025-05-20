import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserProfileEditComponent } from '../user-profile-edit/user-profile-edit.component';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, UserProfileEditComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  editMode = false;
  user: any = null;
  loading = true;
  error: string | null = null;
  selectedFile: File | null = null;
  uploading = false;

  constructor(private authService: AuthService, private http: HttpClient) {}

  toggleEditMode() {
    this.editMode = !this.editMode;
  }

  ngOnInit(): void {
    this.fetchUser();
  }

  fetchUser() {
    this.loading = true;
    this.http.get(`${environment.apiUrl}/api/users/me`).subscribe({
      next: (user: any) => {
        this.user = user;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error || 'Error al cargar el perfil';
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  uploadProfileImage() {
    if (!this.selectedFile || !this.user) return;
    this.uploading = true;
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    this.http.put(`${environment.apiUrl}/users/${this.user.id}/profile-image`, formData).subscribe({
      next: (filename: any) => {
        this.user.profileImage = filename;
        this.uploading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error || 'Error al subir la imagen';
        this.uploading = false;
      }
    });
  }

  getProfileImageUrl(): string {
    if (this.user && this.user.profileImage) {
      return `${environment.apiUrl.replace('/api', '')}/audio/${this.user.profileImage}`;
    }
    return 'https://ui-avatars.com/api/?name=' + (this.user?.username || 'U') + '&background=cccccc&color=333333&size=128';
  }
}
