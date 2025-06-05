import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Playlist } from '../../models/playlist.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faList, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Renderer2 } from '@angular/core';

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css']
})
export class ContextMenuComponent implements OnChanges, OnInit, OnDestroy {
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

  private outsideContextMenuListener: any;
  private outsideClickListener: any;

  constructor(private cdr: ChangeDetectorRef, private renderer: Renderer2) {}

  ngOnInit() {
    // Adjuntar listeners solo una vez
    this.outsideClickListener = this.renderer.listen('document', 'click', this.handleOutsideClick);
    this.outsideContextMenuListener = this.renderer.listen('document', 'contextmenu', this.handleOutsideClick);
  }

  ngOnDestroy() {
    // Limpiar listeners al destruir el componente
    if (this.outsideClickListener) { this.outsideClickListener(); }
    if (this.outsideContextMenuListener) { this.outsideContextMenuListener(); }
  }

  ngOnChanges(changes: SimpleChanges) {
    // La lógica de apertura y cierre ahora se maneja principalmente por la entrada @Input() show
    // Los listeners fuera del clic están adjuntos persistentemente y reaccionan a this.show
    
    if (changes['show'] && changes['show'].currentValue) {
        // Cuando el menú se abre, recalculamos la posición del submenú
        this.calculateSubmenuPosition();
    } else if (changes['show'] && !changes['show'].currentValue) {
      // Resetear el estado del submenú al cerrar el menú principal
      this.showPlaylistSubmenu = false;
       document.body.classList.remove('submenu-open'); // Asegurarse de limpiar la clase
       this.submenuStyles = {}; // Limpiar estilos del submenú
       this.cdr.detectChanges(); // Forzar detección de cambios
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

  // Un solo manejador para clics y clics derechos fuera
  handleOutsideClick = (event: MouseEvent) => {
    // Si el menú no está visible, no hacemos nada
    if (!this.show) {
      return;
    }

    const target = event.target as HTMLElement;
    
    // No hacer nada si el clic fue en el menú contextual o en un submenú
    if (this.contextMenuElementRef && this.contextMenuElementRef.nativeElement.contains(target)) {
      return; // El clic fue dentro del menú, no cerramos
    }

    // Si el clic fue fuera del menú y el menú está visible
    
    // Para clics derechos fuera, prevenimos el comportamiento por defecto
    if (event.type === 'contextmenu') {
        event.preventDefault();
    }

    // Siempre cerramos el menú si el clic fue fuera (para clics izquierdos o derechos)
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
    event.stopPropagation(); // Detener propagación del evento de clic/contextmenu
    this.showPlaylistSubmenu = !this.showPlaylistSubmenu;
    
    // Al abrir el submenú, recalculamos la posición
    if (this.showPlaylistSubmenu) {
      console.log('Submenu toggled ON, calculating position.');
      this.calculateSubmenuPosition();
      document.body.classList.add('submenu-open');
    } else {
       console.log('Submenu toggled OFF.');
       document.body.classList.remove('submenu-open');
       this.submenuStyles = {};
       this.cdr.detectChanges();
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
