// src/app/app.routes.ts (Ejemplo)
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SongListComponent } from './components/song-list/song-list.component';
// Importa un AuthGuard si quieres proteger rutas
// import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  // Probablemente quieras que SongListComponent sea una ruta protegida
  // o la ruta principal después de iniciar sesión
  {
    path: '', // Ruta raíz
    component: SongListComponent
    // canActivate: [authGuard] // Descomenta si quieres protegerla
  },
  // Redirección si la ruta está vacía y no estás logueado (requiere lógica en guard)
  // { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '' } // Redirige rutas no encontradas a la raíz
];
