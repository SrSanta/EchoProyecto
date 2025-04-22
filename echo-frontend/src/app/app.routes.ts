import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SongListComponent } from './components/song-list/song-list.component';
import { RegisterComponent } from './components/register/register.component';
import { SongUploadComponent } from './components/song-upload/song-upload.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'songs',
    component: SongListComponent
  },
  {
    path: 'upload-song',
    component: SongUploadComponent,
  },
  {
    path: '',
    redirectTo: '/songs',
    pathMatch: 'full'
  },
  { path: '**', redirectTo: '/songs' }
];
