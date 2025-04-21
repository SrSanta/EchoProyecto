// src/app/app.component.ts
import { Component, inject } from '@angular/core'; // inject añadido
import { Router, RouterOutlet } from '@angular/router'; // Router añadido
import { AuthService } from './services/auth.service'; // Importa AuthService
import { Observable } from 'rxjs'; // Importa Observable
import { map } from 'rxjs/operators'; // Importa map
import { AsyncPipe } from '@angular/common'; // Importa AsyncPipe

@Component({
  selector: 'app-root',
  standalone: true,
  // Añade AsyncPipe a los imports
  imports: [RouterOutlet, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'echo-frontend';

  // Inyecta los servicios
  private authService = inject(AuthService);
  private router = inject(Router);

  // Observable para saber si el usuario está logueado (para usar con async pipe)
  isLoggedIn$: Observable<boolean>;
  // Observable para obtener el nombre de usuario (opcional, para mostrarlo)
  username$: Observable<string | null>;

  constructor() {
    // Mapea el currentUser$ a un booleano para isLoggedIn$
    this.isLoggedIn$ = this.authService.currentUser$.pipe(map(user => !!user));
    // Expón directamente el observable del nombre de usuario
    this.username$ = this.authService.currentUser$;
  }

  /**
   * Método llamado al hacer clic en el botón de logout.
   */
  logout(): void {
    this.authService.logout(); // Llama al método logout del servicio
    this.router.navigate(['/login']); // Redirige al usuario a la página de login
    console.log('Usuario desconectado');
  }
}
