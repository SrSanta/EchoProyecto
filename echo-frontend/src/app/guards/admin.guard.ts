import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
// Importa tu servicio de autenticación
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Primero verifica si el usuario está logueado
    if (!this.authService.isLoggedIn()) {
      // Si no está logueado, redirigir a login
      return this.router.createUrlTree(['/login']);
    }

    // Si está logueado, verifica si es administrador
    if (this.authService.isAdmin()) {
      // Si es administrador, permitir acceso
      return true;
    } else {
      // Si no es administrador, redirigir a una página de acceso denegado o a explore
      // Puedes crear un componente específico para "Acceso Denegado" si lo deseas
      return this.router.createUrlTree(['/explore']); // Redirigir a explore como ejemplo
    }
  }
} 