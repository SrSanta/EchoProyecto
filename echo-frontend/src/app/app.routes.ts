import { Routes } from '@angular/router';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { UserProfileEditComponent } from './components/user-profile-edit/user-profile-edit.component';
import { PlaybackHistoryComponent } from './components/playback-history/playback-history.component';
import { LoginComponent } from './components/login/login.component';
import { SongListComponent } from './components/song-list/song-list.component';
import { RegisterComponent } from './components/register/register.component';
import { ExploreComponent } from './components/explore/explore.component';
import { SongUploadComponent } from './components/song-upload/song-upload.component';
import { PlaylistsPageComponent } from './components/playlists/playlists-page.component';
import { PublicPlaylistsPageComponent } from './components/public-playlists/public-playlists-page.component';
import { ArtistProfileComponent } from './components/artist-profile/artist-profile.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'songs',
    component: SongListComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'explore',
    component: ExploreComponent
  },
  {
    path: 'upload-song',
    component: SongUploadComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'playlists',
    component: PlaylistsPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'public-playlists',
    component: PublicPlaylistsPageComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'playback-history',
    component: PlaybackHistoryComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [AdminGuard],
    children: [
      {
        path: 'edit',
        component: UserProfileEditComponent,
        canActivate: [AdminGuard]
      }
    ]
  },
  {
    path: 'artist/:username',
    component: ArtistProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: '/explore',
    pathMatch: 'full'
  },
  { path: '**', redirectTo: '/songs' }
];
