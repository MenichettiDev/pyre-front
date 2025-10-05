import { Component, Input, Output, EventEmitter, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css'],
  standalone: true,
  imports: [CommonModule, NgIf, NgbTooltipModule]
})
export class TopbarComponent {
  @Input() isLoggedIn: boolean = false;
  @Input() isSmallScreen: boolean = false;
  // Legacy email props (kept for compatibility)
  @Input() userEmail: string | null = null;
  @Input() displayEmail: string | null = null;

  // New props: mostrar número de legajo en el topbar
  @Input() userLegajo: string | null = null;
  @Input() displayLegajo: string | null = null;
  // Nuevo: tipo de perfil (ej: 'admin', 'operador')
  @Input() userRole: string | null = null;
  @Input() displayRole: string | null = null;
  // Etiqueta descriptiva a mostrar (ej: "Legajo: 12345 — Nombre Apellido")
  @Input() userLabel: string | null = null;

  // Outputs para comunicar con el componente padre (sidebar)
  @Output() perfilModalToggled = new EventEmitter<boolean>();
  @Output() homeNavigation = new EventEmitter<void>();
  @Output() logoutRequested = new EventEmitter<void>();
  @Output() sidebarToggled = new EventEmitter<void>();

  isPerfilModalVisible: boolean = false;
  private el = inject(ElementRef);

  // Tooltip dinámico para el pill (legajo + rol)
  get pillTooltip(): string {
    const leg = this.userLegajo || this.displayLegajo || '';
    const role = this.displayRole || this.userRole || '';
    return role ? `${leg} — ${role}` : leg;
  }

  togglePerfilModal(): void {
    this.isPerfilModalVisible = !this.isPerfilModalVisible;
    this.perfilModalToggled.emit(this.isPerfilModalVisible);
  }

  navigateToHome(): void {
    this.isPerfilModalVisible = false; // Cerrar dropdown al navegar
    this.homeNavigation.emit();
  }

  confirmLogout(): void {
    this.isPerfilModalVisible = false; // Cerrar dropdown antes del logout
    this.logoutRequested.emit();
  }

  toggleSidebar(): void {
    this.sidebarToggled.emit();
  }

  // Cerrar el dropdown si se hace click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.isPerfilModalVisible) return;

    const target = event.target as HTMLElement;

    // Buscar los elementos toggle y dropdown dentro del componente
    const toggle = this.el.nativeElement.querySelector('.profile-toggle') as HTMLElement | null;
    const dropdown = this.el.nativeElement.querySelector('.profile-dropdown') as HTMLElement | null;

    // Si el click fue dentro del toggle o dentro del dropdown, no cerrar
    if ((toggle && toggle.contains(target)) || (dropdown && dropdown.contains(target))) {
      return;
    }

    // En cualquier otro caso, cerrar el dropdown
    this.isPerfilModalVisible = false;
    this.perfilModalToggled.emit(false);
  }
}
