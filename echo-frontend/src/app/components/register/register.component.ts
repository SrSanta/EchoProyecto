import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './register.component.html',
  styles: [`
    .window {
      max-width: 450px;
      margin: 30px auto;
    }
    
    .register-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .form-group {
      margin-bottom: 10px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    input[type="text"],
    input[type="email"],
    input[type="password"] {
      width: 100%;
      padding: 4px;
      margin-top: 2px;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    
    .error-message {
      margin-top: 15px;
      padding: 8px;
      background: #ffdddd;
      border: 2px solid #ff0000;
      color: #ff0000;
      font-weight: bold;
    }
    
    .login-link {
      margin-top: 20px;
      text-align: center;
      font-size: 0.9em;
    }
  `]
})
export class RegisterComponent {
  registrationData: Omit<User, 'id' | 'roles' | 'registrationDate' | 'isProfilePublic'> = {
    username: '',
    email: '',
    password: ''
  };
  errorMessage: string | null = null;
  isLoading = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit(): void {
    if (!this.registrationData.username || !this.registrationData.email || !this.registrationData.password) {
      this.errorMessage = 'Todos los campos son obligatorios.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const dataToSend = {
      ...this.registrationData,
      roles: [{ name: 'ROLE_USER' }]
    };

    this.authService.register(dataToSend).subscribe({
      next: (newUser) => {
        console.log('Registro exitoso:', newUser);
        this.isLoading = false;
        alert('¡Registro completado! Ahora puedes iniciar sesión.');
        this.navigateToLogin();
      },
      error: (error) => {
        console.error('Error en el registro:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.message || 'Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.';
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
