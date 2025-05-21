import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Playlist } from '../../models/playlist.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faList, faChevronRight } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css']
})
export class ContextMenuComponent implements OnChanges {
  // Iconos
  faPlus = faPlus;
  faList = faList;
  faChevronRight = faChevronRight;
  
  // Estado para controlar el submenú de playlists
  showPlaylistSubmenu = false;
  
  // Mensaje de error
  error: string | null = null;

  @Input() playlists: Playlist[] = [];
  @Input() songId: number | null = null;
  @Input() show: boolean = false;
  @Input() position: { x: number, y: number } = { x: 0, y: 0 };

  @Output() addToPlaylist = new EventEmitter<{playlistId: number, songId: number}>();
  @Output() addToQueue = new EventEmitter<number>();
  @Output() closeMenu = new EventEmitter<void>();

  // Estado para controlar el loading al añadir a la cola
  addingToQueue = false;

  ngOnChanges(changes: SimpleChanges) {
    // Cerrar el menú si se hace clic fuera de él
    if (changes['show'] && changes['show'].currentValue) {
      setTimeout(() => {
        document.addEventListener('click', this.onClickOutside);
      });
    } else {
      document.removeEventListener('click', this.onClickOutside);
    }
  }

  onClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // No hacer nada si el clic fue en el menú contextual o en un submenú
    if (target.closest('.context-menu') || target.closest('.submenu')) {
      return;
    }
    
    // Si hay un submenú abierto, solo cerramos el submenú
    if (this.showPlaylistSubmenu) {
      this.showPlaylistSubmenu = false;
      document.body.classList.remove('submenu-open');
      return;
    }
    
    // Si no hay submenú abierto, cerramos todo el menú
    if (!target.closest('.context-menu')) {
      this.closeMenu.emit();
    }
  }

  onAddToPlaylist(playlistId: number | undefined, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.songId && playlistId) {
      this.addToPlaylist.emit({ playlistId, songId: this.songId });
      this.closeMenu.emit();
    }
  }
  
  togglePlaylistSubmenu(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showPlaylistSubmenu = !this.showPlaylistSubmenu;
    
    // Si estamos mostrando el submenú, añadimos una clase al body para manejar clics fuera
    if (this.showPlaylistSubmenu) {
      document.body.classList.add('submenu-open');
    } else {
      document.body.classList.remove('submenu-open');
    }
  }
  
  onAddToQueue() {
    if (this.songId) {
      this.addingToQueue = true;
      this.addToQueue.emit(this.songId);
      // No cerramos el menú automáticamente para dar feedback visual
    }
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }
}
