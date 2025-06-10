import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
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

  onSubmit(form: NgForm): void {
    this.errorMessage = null;
    if (form.invalid) {
      if (form.controls['email'] && form.controls['email'].errors?.['email']) {
        this.errorMessage = 'Por favor, introduce un correo electrónico válido.';
      } else if (form.controls['password'] && form.controls['password'].errors?.['minlength']) {
        this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      } else {
        this.errorMessage = 'Por favor, rellena todos los campos correctamente.';
      }
      return;
    }

    this.isLoading = true;

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
