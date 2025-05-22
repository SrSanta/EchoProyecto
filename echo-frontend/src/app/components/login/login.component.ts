import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf],
  styles: [`
    .window {
      max-width: 400px;
      margin: 50px auto;
    }
    
    form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
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
  `],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  username = '';
  password = '';
  error: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.authService.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => this.error = 'Usuario o contraseña incorrectos'
    });
  }
  
  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}
