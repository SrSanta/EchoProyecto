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
  // Campos y mensajes para cambio de contraseña
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  passwordError: string | null = null;
  passwordSuccess: string | null = null;

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
      next: (response: any) => {
        this.user.profileImage = response.filename;
        this.uploading = false;
        this.success = 'Imagen de perfil subida exitosamente!';
        this.error = null;
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
        // Si el backend devuelve un string plano de error, úsalo directamente
        if (typeof err.error === 'string') {
          this.error = err.error;
        } else if (err.error && err.error.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Ocurrió un error inesperado.';
        }
        this.success = null;
      }
    });
  }

  changePassword() {
    this.passwordError = null;
    this.passwordSuccess = null;
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = 'Completa todos los campos';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Las contraseñas no coinciden';
      return;
    }
    // Llama al endpoint de cambio de contraseña (ajusta la URL si es necesario)
    this.http.put(`${environment.apiUrl}/api/users/${this.user.id}/password`, {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }, {
      responseType: 'text'  // Esperamos una respuesta de texto plano
    }).subscribe({
      next: (res: any) => {
        console.log('Respuesta exitosa del servidor:', res);
        // Usamos el mensaje de la respuesta o uno por defecto
        this.passwordSuccess = res || 'Contraseña actualizada exitosamente';
        this.passwordError = null;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error del servidor:', err);
        console.error('Error.error:', err.error);
        console.error('Status:', err.status);
        console.error('Status Text:', err.statusText);
        
        // Siempre muestra el mensaje tal como lo envía el backend
        if (typeof err.error === 'string') {
          this.passwordError = err.error;
        } else if (err.error && err.error.message) {
          this.passwordError = err.error.message;
        } else if (err.message) {
          this.passwordError = err.message;
        } else {
          this.passwordError = `Error inesperado (${err.status || 'sin código'})`;
        }
        this.passwordSuccess = null;
      }
    });
  }

  getProfileImageUrl(): string {
    if (this.user && this.user.profileImage) {
      return `${environment.apiUrl}/api/users/profile-image/${this.user.profileImage}`;
    }
    return 'https://ui-avatars.com/api/?name=' + (this.user?.username || 'U') + '&background=cccccc&color=333333&size=128';
  }
}
