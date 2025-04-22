import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SongListComponent } from './components/song-list/song-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: SongListComponent
  },
  { path: '**', redirectTo: '' }
];
