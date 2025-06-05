import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
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
  // Propiedad para almacenar los estilos dinámicos del submenú
  submenuStyles: any = {};
  
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

  // Referencias a los elementos del DOM
  @ViewChild('contextMenuElement') contextMenuElementRef!: ElementRef;
  @ViewChild('playlistSubmenuElement') playlistSubmenuElementRef!: ElementRef;

  constructor(private cdr: ChangeDetectorRef) {} // Inyectar ChangeDetectorRef

  ngOnChanges(changes: SimpleChanges) {
    // Cerrar el menú si se hace clic fuera de él
    if (changes['show'] && changes['show'].currentValue) {
      setTimeout(() => {
        document.addEventListener('click', this.onClickOutside);
        // Recalcular la posición del submenú cuando se abre el menú principal
        this.calculateSubmenuPosition();
      });
    } else if (changes['show'] && !changes['show'].currentValue) {
      document.removeEventListener('click', this.onClickOutside);
      // Resetear el estado del submenú al cerrar el menú principal
      this.showPlaylistSubmenu = false;
       document.body.classList.remove('submenu-open'); // Asegurarse de limpiar la clase
       this.submenuStyles = {}; // Limpiar estilos del submenú
    }
  }

  // Método para calcular la posición del submenú
  calculateSubmenuPosition() {
    // Usamos un pequeño setTimeout para asegurarnos de que el DOM esté actualizado y los elementos permitan medir su tamaño y posición
     setTimeout(() => {
       // Asegurarse de que los elementos existan
        if (!this.contextMenuElementRef || !this.contextMenuElementRef.nativeElement ||
            !this.playlistSubmenuElementRef || !this.playlistSubmenuElementRef.nativeElement) {
              console.warn('Elementos del menú o submenú no disponibles para cálculo de posición.');
              return;
        }

        const menuRect: DOMRect = this.contextMenuElementRef.nativeElement.getBoundingClientRect();
        const submenuRect: DOMRect = this.playlistSubmenuElementRef.nativeElement.getBoundingClientRect();
        const windowWidth = window.innerWidth;

        console.log('Menu Rect:', menuRect);
        console.log('Submenu Rect:', submenuRect);
        console.log('Window Width:', windowWidth);
        console.log('Menu right + submenu width:', menuRect.right + submenuRect.width);

        // Verificar si el submenú se sale por la derecha
        // Posición derecha del menú principal + ancho del submenú > ancho de la ventana
        if (menuRect.right + submenuRect.width > windowWidth - 10) { // 10px de margen
          console.log('Calculating submenu position to the left.');
           this.submenuStyles = {
             'left': 'auto', // Anular left por defecto
             'right': `calc(100% - 8px)`, // Posicionar a la izquierda del padre
             'transform': 'translateX(-10px)' // Ajuste inicial para la transición a la izquierda
           };
        } else {
           console.log('Calculating submenu position to the right.');
           this.submenuStyles = {
             'left': `calc(100% - 8px)`, // Posición por defecto a la derecha
             'right': 'auto', // Anular right si estaba a la izquierda
              'transform': 'translateX(10px)' // Ajuste inicial para la transición a la derecha
           };
        }

        // Forzar detección de cambios para actualizar la vista con los nuevos estilos
         this.cdr.detectChanges();
     }, 50); // Aumentar el retraso ligeramente
  }


  onClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // No hacer nada si el clic fue en el menú contextual o en un submenú
    if (this.contextMenuElementRef && this.contextMenuElementRef.nativeElement.contains(target)) {
      // Si el clic es dentro del menú principal, no cerramos
      return;
    }

    // Si el clic fue fuera del menú principal
    this.closeMenu.emit();
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
    
    // Al abrir el submenú, recalculamos la posición
    if (this.showPlaylistSubmenu) {
      console.log('Submenu toggled ON, calculating position.');
      // Llamamos a calculateSubmenuPosition, que ya tiene su propio setTimeout interno
      this.calculateSubmenuPosition();
      document.body.classList.add('submenu-open'); // Añadir clase al body para manejar clics fuera
    } else {
       console.log('Submenu toggled OFF.');
       document.body.classList.remove('submenu-open'); // Limpiar clase al cerrar el submenú
       this.submenuStyles = {}; // Limpiar estilos del submenú al cerrar
       this.cdr.detectChanges(); // Forzar detección de cambios
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
