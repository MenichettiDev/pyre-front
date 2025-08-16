import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { Subscription } from 'rxjs';
import { ConfirmModalComponent } from "../../components/modals/confirm-modal/confirm-modal.component";

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
  imports: [CommonModule, ConfirmModalComponent, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  // Estados del componente
  isModalVisible = false;
  isSidebarVisible = false;
  isLoggedIn = false;
  id_acceso = 1;
  isSmallScreen = window.innerWidth < 992;
  isPerfilModalVisible = false;

  // Agregar propiedades para usuario
  nombreCompleto = '';
  nombreUsuario = '';
  apellidoUsuario = '';

  private subscription = new Subscription();

  // Menú hardcodeado basado en tu estructura
  private readonly allMenuItems: MenuItem[] = [
    // Dashboard
    { id: 1, descripcion: 'Dashboard', icono: 'bi bi-speedometer2', link: '/dashboard', grupo: 'GM01', principal: true, orden: 1, estado: true, requiredAccess: [1, 2, 3, 4] },
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
    { id: 14, descripcion: 'Gestión de Usuarios', icono: 'bi bi-people', link: '/usuarios', grupo: 'GM04', principal: true, orden: 4, estado: true, requiredAccess: [1] },
    { id: 15, descripcion: 'Listado de Empleados', icono: 'bi bi-list-ul', link: '/usuarios/listado', grupo: 'GM04', principal: false, orden: 1, estado: true, requiredAccess: [1] },
    { id: 16, descripcion: 'Alta / Edición de Usuario', icono: 'bi bi-person-plus', link: '/usuarios/alta', grupo: 'GM04', principal: false, orden: 2, estado: true, requiredAccess: [1] },
    { id: 17, descripcion: 'Roles y Permisos', icono: 'bi bi-shield-lock', link: '/usuarios/roles', grupo: 'GM04', principal: false, orden: 3, estado: true, requiredAccess: [1] },

    // Reportes
    { id: 18, descripcion: 'Reportes', icono: 'bi bi-bar-chart', link: '/reportes', grupo: 'GM05', principal: true, orden: 5, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 19, descripcion: 'Herramientas por Estado', icono: 'bi bi-clipboard-data', link: '/reportes/estado', grupo: 'GM05', principal: false, orden: 1, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 20, descripcion: 'Stock Valorizado', icono: 'bi bi-cash-coin', link: '/reportes/stock', grupo: 'GM05', principal: false, orden: 2, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 21, descripcion: 'Uso por Operario', icono: 'bi bi-person-check', link: '/reportes/operario', grupo: 'GM05', principal: false, orden: 3, estado: true, requiredAccess: [1, 2, 3, 4] },
    { id: 22, descripcion: 'Movimientos por Fecha / Herramienta', icono: 'bi bi-calendar-range', link: '/reportes/movimientos', grupo: 'GM05', principal: false, orden: 4, estado: true, requiredAccess: [1, 2, 3, 4] },

    // Configuración (solo Administrador)
    { id: 23, descripcion: 'Configuración', icono: 'bi bi-gear', link: '/configuracion', grupo: 'GM06', principal: true, orden: 6, estado: true, requiredAccess: [1] },
    { id: 24, descripcion: 'Parámetros Generales', icono: 'bi bi-sliders', link: '/configuracion/parametros', grupo: 'GM06', principal: false, orden: 1, estado: true, requiredAccess: [1] },
    { id: 25, descripcion: 'Tipos de Estado', icono: 'bi bi-tags', link: '/configuracion/estados', grupo: 'GM06', principal: false, orden: 2, estado: true, requiredAccess: [1] },
    { id: 26, descripcion: 'Alertas y Notificaciones', icono: 'bi bi-bell-fill', link: '/configuracion/alertas', grupo: 'GM06', principal: false, orden: 3, estado: true, requiredAccess: [1] },
  ];

  // Servicios inyectados
  private authService = inject(AuthService);
  private router = inject(Router);

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
      this.authService.loggedIn$.subscribe(isLoggedIn => {
        this.isLoggedIn = isLoggedIn;
        // this.isLoggedIn = true;
        this.isSidebarVisible = isLoggedIn && !this.isSmallScreen;
        // this.isSidebarVisible = true;

        if (isLoggedIn) {
          this.loadUserData();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private loadUserData() {
    const user = this.authService.getUser();
    if (user) {
      this.id_acceso = user.id_acceso;
      this.nombreUsuario = user.nombre || '';
      this.apellidoUsuario = user.apellido || '';
      this.nombreCompleto = `${this.nombreUsuario} ${this.apellidoUsuario}`.trim();
    }
  }

  // Getters para el menú filtrado
  get visibleMenuItems(): MenuItem[] {
    return this.allMenuItems.filter(item =>
      item.principal &&
      item.estado &&
      item.requiredAccess.includes(this.id_acceso)
    ).sort((a, b) => a.orden - b.orden);
  }

  // Métodos para el manejo del menú
  getSubMenus(menu: MenuItem): MenuItem[] {
    return this.allMenuItems.filter(item =>
      !item.principal &&
      item.grupo === menu.grupo &&
      item.estado &&
      item.requiredAccess.includes(this.id_acceso)
    ).sort((a, b) => a.orden - b.orden);
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
        this.isSidebarVisible = false;
      }
    }
  }

  isMenuExpanded(menu: MenuItem): boolean {
    return !!menu.expanded;
  }

  toggleSidebar() {
    if (this.isSmallScreen) {
      this.isSidebarVisible = !this.isSidebarVisible;
    }
  }

  navigateToHome() {
    this.router.navigate(['/inicio']);
  }

  // Métodos del perfil
  getPerfilName(): string {
    const profiles: { [key: number]: string } = {
      1: 'Admin',
      2: 'Usuario'
    };
    return profiles[this.id_acceso] || 'Usuario';
  }

  getPerfilIcon(): string {
    const icons: { [key: number]: string } = {
      1: 'bx bx-crown',
      2: 'bx bx-dumbbell',
      3: 'bx bx-run',
      4: 'bx bx-building'
    };
    return icons[this.id_acceso] || 'bx bx-user';
  }

  getPerfilClass(): string {
    const classes: { [key: number]: string } = {
      1: 'perfil-admin',
      2: 'perfil-usuario'
    };
    return classes[this.id_acceso] || 'perfil-default';
  }

  // Método para obtener el nombre completo
  getNombreCompleto(): string {
    return this.nombreCompleto || 'Usuario';
  }

  // Métodos del modal de logout
  confirmLogout() {
    this.isModalVisible = true;
  }

  handleConfirm() {
    this.authService.logout();
    this.router.navigate(['/login/login']);
    this.isModalVisible = false;
  }

  handleCancel() {
    this.isModalVisible = false;
  }


}