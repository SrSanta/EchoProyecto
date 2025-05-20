import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile-edit.component.html',
  styleUrls: ['./user-profile-edit.component.css']
})
export class UserProfileEditComponent implements OnInit {
  user: any = null;
  loading = true;
  error: string | null = null;
  success: string | null = null;

  private toDisplayString(val: any): string {
    if (val == null) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val.message) return val.message;
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  selectedFile: File | null = null;
  uploading = false;
  newUsername: string = '';
  newEmail: string = '';

  constructor(private authService: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchUser();
  }

  fetchUser() {
    this.loading = true;
    this.http.get(`${environment.apiUrl}/api/users/me`).subscribe({
      next: (user: any) => {
        this.user = user;
        this.newUsername = user.username;
        this.newEmail = user.email;
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
    this.http.put(`${environment.apiUrl}/api/users/${this.user.id}/profile-image`, formData).subscribe({
      next: (filename: any) => {
        this.user.profileImage = filename;
        this.uploading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = this.toDisplayString(err.error);
        this.uploading = false;
      }
    });
  }

  saveChanges() {
    if (!this.user) return;
    this.success = null;
    this.error = null;
    const updateData: any = {
      username: this.newUsername,
      email: this.newEmail
    };
    this.http.put(`${environment.apiUrl}/api/users/${this.user.id}`, updateData).subscribe({
      next: (updated: any) => {
        this.user.username = updated.username;
        this.user.email = updated.email;
        this.error = null;
        this.success = 'Perfil actualizado con éxito';
      },
      error: (err: HttpErrorResponse) => {
        this.error = this.toDisplayString(err.error);
        this.success = null;
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
