import { Routes } from '@angular/router';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { UserProfileEditComponent } from './components/user-profile-edit/user-profile-edit.component';
import { PlaybackHistoryComponent } from './components/playback-history/playback-history.component';
import { LoginComponent } from './components/login/login.component';
import { SongListComponent } from './components/song-list/song-list.component';
import { RegisterComponent } from './components/register/register.component';
import { SongUploadComponent } from './components/song-upload/song-upload.component';
import { PlaylistsPageComponent } from './components/playlists/playlists-page.component';
import { PublicPlaylistsPageComponent } from './components/public-playlists/public-playlists-page.component';

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
    path: 'playlists',
    component: PlaylistsPageComponent,
  },
  {
    path: 'public-playlists',
    component: PublicPlaylistsPageComponent,
  },
  {
    path: 'playback-history',
    component: PlaybackHistoryComponent
  },
  {
    path: 'profile',
    component: UserProfileComponent,
    children: [
      {
        path: 'edit',
        component: UserProfileEditComponent
      }
    ]
  },
  {
    path: '',
    redirectTo: '/songs',
    pathMatch: 'full'
  },
  { path: '**', redirectTo: '/songs' }
];
