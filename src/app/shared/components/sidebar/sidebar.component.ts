import { Component, OnInit, OnDestroy, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { Roles } from '../../enums/roles';
import { Subscription } from 'rxjs';
import { TopbarComponent } from '../topbar/topbar.component'; // Importar el componente TopbarComponent
import { SidebarService } from '../../../core/services/sidebar.service';
  // Usaremos el servicio AlertService para mostrar modales (envuelve SweetAlert2)

interface MenuItem {
  id: number;
  descripcion: string;
  icono: string;
  link: string;
  grupo: string;
  principal: boolean;
  orden: number;
  estado: boolean;
  expanded?: boolean;
  requiredAccess: number[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TopbarComponent], // Agregar TopbarComponent aquí
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  // Estados del componente
  // ya no usamos el modal local; usaremos SweetAlert2
  isModalVisible = false; // conservamos por compatibilidad en caso de uso distinto
  isSidebarVisible = false;
  isLoggedIn = false;
  id_acceso = 0;
  isSmallScreen = window.innerWidth < 992;
  isPerfilModalVisible = false;

  // Agregar propiedades para usuario
  nombreCompleto = '';
  userEmail: string = '';
  displayEmail: string = '';
  // Nuevo: legajo
  userLegajo: string = '';
  displayLegajo: string = '';
  // Nuevo: role
  displayRole: string = '';
  // Etiqueta descriptiva que se mostrará en el topbar: "Legajo: 12345 — Nombre Apellido"
  displayUserLabel: string = '';

  private subscription = new Subscription();

  // Menú hardcodeado basado en tu estructura
  private readonly allMenuItems: MenuItem[] = [
  // Dashboard
  { id: 1, descripcion: 'Dashboard', icono: 'bi bi-speedometer2', link: '/dashboard', grupo: 'GM01', principal: true, orden: 1, estado: true, requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] },
    { id: 2, descripcion: 'Resumen General', icono: 'bi bi-graph-up', link: '/dashboard/resumen', grupo: 'GM01', principal: false, orden: 1, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 3, descripcion: 'Alertas Pendientes', icono: 'bi bi-bell', link: '/dashboard/alertas', grupo: 'GM01', principal: false, orden: 2, estado: true, requiredAccess: [1, 2, 3, 4] },

    // Gestión de Herramientas
    { id: 4, descripcion: 'Gestión de Herramientas', icono: 'bi bi-tools', link: '/herramientas', grupo: 'GM02', principal: true, orden: 2, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 5, descripcion: 'Listado de Herramientas', icono: 'bi bi-list-task', link: '/herramientas/listado', grupo: 'GM02', principal: false, orden: 1, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 6, descripcion: 'Registro / Alta de Herramienta', icono: 'bi bi-plus-circle', link: '/herramientas/alta', grupo: 'GM02', principal: false, orden: 2, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 7, descripcion: 'Estados de Herramientas', icono: 'bi bi-check2-circle', link: '/herramientas/estados', grupo: 'GM02', principal: false, orden: 3, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 8, descripcion: 'Ubicación Física', icono: 'bi bi-geo-alt', link: '/herramientas/ubicacion', grupo: 'GM02', principal: false, orden: 4, estado: true, requiredAccess: [1, 2, 3, 4] },

    // Movimientos / Trazabilidad
    { id: 9, descripcion: 'Movimientos', icono: 'bi bi-arrow-left-right', link: '/movimientos', grupo: 'GM03', principal: true, orden: 3, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 10, descripcion: 'Registrar Préstamo', icono: 'bi bi-box-arrow-in-right', link: '/movimientos/prestamo', grupo: 'GM03', principal: false, orden: 1, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 11, descripcion: 'Registrar Devolución', icono: 'bi bi-box-arrow-in-left', link: '/movimientos/devolucion', grupo: 'GM03', principal: false, orden: 2, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 12, descripcion: 'Historial de Herramienta', icono: 'bi bi-clock-history', link: '/movimientos/historial', grupo: 'GM03', principal: false, orden: 3, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 13, descripcion: 'Movimientos por Operario', icono: 'bi bi-person-lines-fill', link: '/movimientos/operario', grupo: 'GM03', principal: false, orden: 4, estado: true, requiredAccess: [1, 2, 3, 4] },

  // Gestión de Usuarios
  { id: 14, descripcion: 'Gestión de Usuarios', icono: 'bi bi-people', link: '/user', grupo: 'GM04', principal: true, orden: 4, estado: true, requiredAccess: [1, 2, 3, 4] },
  { id: 15, descripcion: 'Lista de Usuarios', icono: 'bi bi-list-ul', link: '/user/list', grupo: 'GM04', principal: false, orden: 1, estado: true, requiredAccess: [1, 2, 3, 4] },
  { id: 17, descripcion: 'Roles y Permisos', icono: 'bi bi-shield-lock', link: '/user/roles', grupo: 'GM04', principal: false, orden: 3, estado: true, requiredAccess: [1, 2, 3, 4] },

    // Reportes
    { id: 18, descripcion: 'Reportes', icono: 'bi bi-bar-chart', link: '/reportes', grupo: 'GM05', principal: true, orden: 5, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 19, descripcion: 'Herramientas por Estado', icono: 'bi bi-clipboard-data', link: '/reportes/estado', grupo: 'GM05', principal: false, orden: 1, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 20, descripcion: 'Stock Valorizado', icono: 'bi bi-cash-coin', link: '/reportes/stock', grupo: 'GM05', principal: false, orden: 2, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 21, descripcion: 'Uso por Operario', icono: 'bi bi-person-check', link: '/reportes/operario', grupo: 'GM05', principal: false, orden: 3, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 22, descripcion: 'Movimientos por Fecha / Herramienta', icono: 'bi bi-calendar-range', link: '/reportes/movimientos', grupo: 'GM05', principal: false, orden: 4, estado: true, requiredAccess: [1, 2, 3, 4] },

  // Configuración (solo Administrador)
  { id: 23, descripcion: 'Configuración', icono: 'bi bi-gear', link: '/configuracion', grupo: 'GM06', principal: true, orden: 6, estado: true, requiredAccess: [Roles.SuperAdmin] },
  { id: 24, descripcion: 'Parámetros Generales', icono: 'bi bi-sliders', link: '/configuracion/parametros', grupo: 'GM06', principal: false, orden: 1, estado: true, requiredAccess: [Roles.SuperAdmin] },
  { id: 25, descripcion: 'Tipos de Estado', icono: 'bi bi-tags', link: '/configuracion/estados', grupo: 'GM06', principal: false, orden: 2, estado: true, requiredAccess: [Roles.SuperAdmin] },
  { id: 26, descripcion: 'Alertas y Notificaciones', icono: 'bi bi-bell-fill', link: '/configuracion/alertas', grupo: 'GM06', principal: false, orden: 3, estado: true, requiredAccess: [Roles.SuperAdmin] },
  ];

  // Servicios inyectados
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private el = inject(ElementRef);
  private sidebarService = inject(SidebarService);

  @HostListener('window:resize')
  onResize() {
    const previousState = this.isSmallScreen;
    this.isSmallScreen = window.innerWidth < 992;

    if (this.isSmallScreen !== previousState) {
      if (this.isSmallScreen) {
        this.isSidebarVisible = false;
      } else {
        this.isSidebarVisible = this.isLoggedIn;
      }
    }
  }

  ngOnInit() {
    this.loadUserData();
    this.subscription.add(
      this.authService.loggedIn$.subscribe((isLoggedIn: boolean) => {
        this.isLoggedIn = isLoggedIn;
        // Mostrar u ocultar el sidebar según pantalla y login
        if (isLoggedIn) {
          if (this.isSmallScreen) {
            this.sidebarService.hide();
          } else {
            this.sidebarService.show();
          }
          this.loadUserData();
        } else {
          this.sidebarService.hide();
        }
      })
    );

    // Suscribirse al estado del sidebar
    this.subscription.add(
      this.sidebarService.visible$.subscribe(v => {
        this.isSidebarVisible = v;
      })
    );

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private loadUserData() {
    const user = this.authService.getUser();
    if (user) {
      // Normalizar a número
      this.id_acceso = user.id_acceso != null ? Number(user.id_acceso) : 0;
      const nombre = user.nombre || '';
      const apellido = user.apellido || '';
      this.nombreCompleto = `${nombre} ${apellido}`.trim() || 'Usuario';
  // email (legacy)
  this.userEmail = user.email || '';
  this.displayEmail = this.userEmail && this.userEmail.length > 22 ? this.userEmail.slice(0, 19) + '...' : this.userEmail;

  // legajo (preferir legajo en raw si existe)
  const legajo = user.legajo ?? user.raw?.legajo ?? user.id ?? null;
  this.userLegajo = legajo != null ? String(legajo) : '';
  this.displayLegajo = this.userLegajo && this.userLegajo.length > 12 ? this.userLegajo.slice(0, 9) + '...' : this.userLegajo;
      // Construir etiqueta descriptiva: incluir legajo y nombre completo si están disponibles
      const legInfo = this.userLegajo ? `Legajo: ${this.userLegajo}` : '';
      const nameInfo = this.nombreCompleto ? ` — ${this.nombreCompleto}` : '';
      this.displayUserLabel = (legInfo + nameInfo).trim() || 'Usuario';
  // role (si viene en la respuesta del usuario)
  const roleName = user.rolNombre ?? user.role ?? user.rol ?? '';
  this.displayRole = roleName ? String(roleName) : '';
    } else {
      // Sin usuario: ocultar menú y mostrar nombre por defecto
      this.id_acceso = 0;
      this.nombreCompleto = 'Usuario Demo';
      this.userEmail = '';
      this.displayEmail = '';
      this.userLegajo = '';
      this.displayLegajo = '';
      this.displayUserLabel = 'Usuario';
    }
  }

  // Getters para el menú filtrado
  get visibleMenuItems(): MenuItem[] {
    return this.allMenuItems.filter(item =>
      item.principal &&
      item.estado &&
      this.isItemVisibleForUser(item)
    ).sort((a, b) => a.orden - b.orden);
  }

  // Métodos para el manejo del menú
  getSubMenus(menu: MenuItem): MenuItem[] {
    return this.allMenuItems.filter(item =>
      !item.principal &&
      item.grupo === menu.grupo &&
      item.estado &&
      this.isItemVisibleForUser(item)
    ).sort((a, b) => a.orden - b.orden);
  }

  // Decide si un ítem del menú es visible para el usuario actual.
  private isItemVisibleForUser(item: MenuItem): boolean {
    // Si no hay usuario logueado, ocultar todo
    if (!this.isLoggedIn || !this.id_acceso) return false;

    // Primero, comprobar el requiredAccess declarado en el propio item
    const itemAllowed = item.requiredAccess && item.requiredAccess.length > 0
      ? item.requiredAccess.map(x => Number(x))
      : undefined;

    // Segundo, intentar obtener la restricción del route padre (primer segmento)
    const parentAllowed = this.getParentRequiredAccessForLink(item.link);

    // Si hay restricción en el padre, la efectiva es la intersección
    if (parentAllowed && parentAllowed.length > 0) {
      const allowed = itemAllowed && itemAllowed.length > 0
        ? itemAllowed.filter(x => parentAllowed.includes(x))
        : parentAllowed;
      return allowed.includes(this.id_acceso);
    }

    // Si no hay restricción en el padre, usar la del item (o permitir si no hay ninguna)
    if (!itemAllowed || itemAllowed.length === 0) return true;
    return itemAllowed.includes(this.id_acceso);
  }

  // Buscar en Router.config la ruta padre (primer segmento) y leer su data.requiredAccess
  private getParentRequiredAccessForLink(link: string): number[] | undefined {
    try {
      const segments = link.split('/').filter(s => s.length > 0);
      if (segments.length === 0) return undefined;
      const first = segments[0];
      const route = this.router.config.find(r => r.path === first);
      const ra = route?.data?.['requiredAccess'] as number[] | undefined;
      return ra ? ra.map(x => Number(x)) : undefined;
    } catch (e) {
      return undefined;
    }
  }

  toggleSubMenu(menu: MenuItem) {
    // Cerrar otros menús
    this.visibleMenuItems.forEach(m => {
      if (m !== menu) m.expanded = false;
    });
    menu.expanded = !menu.expanded;
  }

  navigateToSubMenu(subMenu: MenuItem) {
    if (subMenu.link && subMenu.link !== '/') {
      this.router.navigate([subMenu.link]);
      if (this.isSmallScreen) {
        this.sidebarService.hide();
      }
    }
  }

  isMenuExpanded(menu: MenuItem): boolean {
    return !!menu.expanded;
  }

  toggleSidebar() {
    // Delegar en el servicio para mantener estado global
    this.sidebarService.toggle();
  }

  navigateToHome() {
    this.router.navigate(['/inicio']);
  }

  // Método para obtener el nombre completo
  getNombreCompleto(): string {
    return this.nombreCompleto || 'Usuario';
  }

  // Método de logout: muestra SweetAlert2 con estilo básico y centrado
  confirmLogout() {
    // Cerrar el dropdown antes de abrir el diálogo
    this.isPerfilModalVisible = false;

    // Usar AlertService (wrapper de SweetAlert2). Devuelve la promesa de Swal.fire
    this.alertService
      .confirm('¿Estás seguro de que deseas cerrar sesión?', '¿Cerrar sesión?')
      .then((result: any) => {
        if (result && result.isConfirmed) {
          this.authService.logout();
          this.router.navigate(['/login/login']);
        }
      });
  }

  // Método para toggle del modal de perfil
  togglePerfilModal() {
    this.isPerfilModalVisible = !this.isPerfilModalVisible;
  }

  // Método para manejar el evento del topbar
  onPerfilModalToggled(isVisible: boolean) {
    this.isPerfilModalVisible = isVisible;
  }

  // Cerrar el dropdown si se hace click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!this.isPerfilModalVisible) return;

    // Buscar los elementos toggle y dropdown dentro del componente
    const toggle = this.el.nativeElement.querySelector('.profile-toggle') as HTMLElement | null;
    const dropdown = this.el.nativeElement.querySelector('.profile-dropdown') as HTMLElement | null;

    // Si el click fue dentro del toggle o dentro del dropdown, no cerrar
    if ((toggle && toggle.contains(target)) || (dropdown && dropdown.contains(target))) {
      return;
    }

    // En cualquier otro caso, cerrar el dropdown
    this.isPerfilModalVisible = false;
  }



}
