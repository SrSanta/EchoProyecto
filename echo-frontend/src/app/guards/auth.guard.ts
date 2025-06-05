import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
// Importa tu servicio de autenticación aquí
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService, // <-- Inyectado
    private router: Router
    ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Aquí debes reemplazar this.authService.isLoggedIn() con la forma correcta
    // de verificar si el usuario está logueado en tu aplicación.
    const isLoggedIn = this.authService.isLoggedIn(); // <-- Uso del servicio de autenticación

    // Rutas que deben ser inaccesibles para usuarios logueados
    const authRoutes = ['/login', '/register'];

    if (isLoggedIn) {
      // Si está logueado y trata de acceder a login o register, redirigir a explore
      if (authRoutes.includes(state.url)) {
        return this.router.createUrlTree(['/explore']);
      }
      // Si está logueado y trata de acceder a cualquier otra ruta, permitir
      return true;
    } else {
      // Si NO está logueado y trata de acceder a login o register, permitir
      if (authRoutes.includes(state.url)) {
        return true;
      }
      // Si NO está logueado y trata de acceder a una ruta protegida, redirigir a login
      // Puedes añadir lógica aquí para guardar la URL a la que intentaba acceder para redirigirlo después del login
      return this.router.createUrlTree(['/login']);
    }
  }
} 