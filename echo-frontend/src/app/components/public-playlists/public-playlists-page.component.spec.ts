import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicPlaylistsPageComponent } from './public-playlists-page.component';
import { PlaylistService } from '../../services/playlist.service';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('PublicPlaylistsPageComponent', () => {
  let component: PublicPlaylistsPageComponent;
  let fixture: ComponentFixture<PublicPlaylistsPageComponent>;
  let playlistServiceSpy: jasmine.SpyObj<PlaylistService>;

  beforeEach(async () => {
    playlistServiceSpy = jasmine.createSpyObj('PlaylistService', ['getAllPublicPlaylists']);
    playlistServiceSpy.getAllPublicPlaylists.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PublicPlaylistsPageComponent, CommonModule, FormsModule],
      providers: [
        { provide: PlaylistService, useValue: playlistServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicPlaylistsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
