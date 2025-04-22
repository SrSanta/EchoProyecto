import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'echo-frontend';

  private authService = inject(AuthService);
  private router = inject(Router);

  isLoggedIn$: Observable<boolean>;
  username$: Observable<string | null>;

  constructor() {
    this.isLoggedIn$ = this.authService.currentUser$.pipe(map(user => !!user));
    this.username$ = this.authService.currentUser$;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    console.log('Usuario desconectado');
  }
}
