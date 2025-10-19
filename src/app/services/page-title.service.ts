import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Interfaz para la metadata de la página
export interface PageMetadata {
  title: string;
  icon?: string;           // Clase de icono (ej: 'bi-house-door')
  subtitle?: string;       // Descripción breve
  breadcrumbs?: Breadcrumb[]; // Ruta de navegación
  color?: string;          // Color temático (primary, success, etc.)
  badge?: {                // Badge opcional (ej: "3 nuevos")
    text: string;
    color: string;
  };
}

export interface Breadcrumb {
  label: string;
  icon?: string;
  route?: string;  // Ruta opcional para navegación
}

@Injectable({
  providedIn: 'root'
})
export class PageTitleService {
  // BehaviorSubject para el título simple (retrocompatibilidad)
  private titleSubject = new BehaviorSubject<string>('Sistema de Gestión');
  public title$ = this.titleSubject.asObservable();

  // BehaviorSubject para metadata completa
  private metadataSubject = new BehaviorSubject<PageMetadata>({
    title: 'Sistema de Gestión',
    icon: 'bi-house-door',
    color: 'primary'
  });
  public metadata$ = this.metadataSubject.asObservable();

  // Mapa de configuración predefinida por ruta
  private pageConfigs: { [key: string]: Partial<PageMetadata> } = {
    '/dashboard': {
      title: 'Dashboard',
      icon: 'bi-speedometer2',
      subtitle: 'Resumen general del sistema',
      color: 'primary',
      breadcrumbs: [
        { label: 'Inicio', icon: 'bi-house-door', route: '/' }
      ]
    },
    '/usuarios': {
      title: 'Gestión de Usuarios',
      icon: 'bi-people',
      subtitle: 'Administrar usuarios del sistema',
      color: 'info',
      breadcrumbs: [
        { label: 'Inicio', icon: 'bi-house-door', route: '/' },
        { label: 'Usuarios', icon: 'bi-people' }
      ]
    },
    '/herramientas': {
      title: 'Gestión de Herramientas',
      icon: 'bi-tools',
      subtitle: 'Inventario y control de herramientas',
      color: 'warning',
      breadcrumbs: [
        { label: 'Inicio', icon: 'bi-house-door', route: '/' },
        { label: 'Herramientas', icon: 'bi-tools' }
      ]
    },
    '/movimientos': {
      title: 'Movimientos',
      icon: 'bi-arrow-left-right',
      subtitle: 'Historial de préstamos y devoluciones',
      color: 'success',
      breadcrumbs: [
        { label: 'Inicio', icon: 'bi-house-door', route: '/' },
        { label: 'Movimientos', icon: 'bi-arrow-left-right' }
      ]
    },
    '/movimientos/prestamo': {
      title: 'Registrar Préstamo',
      icon: 'bi-box-arrow-in-right',
      subtitle: 'Crear nuevo préstamo de herramienta',
      color: 'success',
      breadcrumbs: [
        { label: 'Inicio', icon: 'bi-house-door', route: '/' },
        { label: 'Movimientos', icon: 'bi-arrow-left-right', route: '/movimientos' },
        { label: 'Nuevo Préstamo', icon: 'bi-box-arrow-in-right' }
      ]
    },
    '/movimientos/devolucion': {
      title: 'Registrar Devolución',
      icon: 'bi-box-arrow-in-left',
      subtitle: 'Procesar devolución de herramienta',
      color: 'primary',
      breadcrumbs: [
        { label: 'Inicio', icon: 'bi-house-door', route: '/' },
        { label: 'Movimientos', icon: 'bi-arrow-left-right', route: '/movimientos' },
        { label: 'Devolución', icon: 'bi-box-arrow-in-left' }
      ]
    },
    '/obras': {
      title: 'Gestión de Obras',
      icon: 'bi-building',
      subtitle: 'Proyectos y obras activas',
      color: 'warning',
      breadcrumbs: [
        { label: 'Inicio', icon: 'bi-house-door', route: '/' },
        { label: 'Obras', icon: 'bi-building' }
      ]
    },
    '/reportes': {
      title: 'Reportes',
      icon: 'bi-file-earmark-bar-graph',
      subtitle: 'Informes y estadísticas',
      color: 'danger',
      breadcrumbs: [
        { label: 'Inicio', icon: 'bi-house-door', route: '/' },
        { label: 'Reportes', icon: 'bi-file-earmark-bar-graph' }
      ]
    },
    '/configuracion': {
      title: 'Configuración',
      icon: 'bi-gear',
      subtitle: 'Ajustes del sistema',
      color: 'secondary',
      breadcrumbs: [
        { label: 'Inicio', icon: 'bi-house-door', route: '/' },
        { label: 'Configuración', icon: 'bi-gear' }
      ]
    }
  };

  constructor() {}

  /**
   * Establece el título de la página (método simple - retrocompatibilidad)
   */
  setTitle(title: string): void {
    this.titleSubject.next(title);

    // Actualizar también metadata con título simple
    const currentMetadata = this.metadataSubject.value;
    this.metadataSubject.next({
      ...currentMetadata,
      title
    });
  }

  /**
   * Establece la metadata completa de la página
   */
  setMetadata(metadata: PageMetadata): void {
    this.metadataSubject.next(metadata);
    this.titleSubject.next(metadata.title); // Mantener sincronizado
  }

  /**
   * Establece la metadata basándose en la ruta actual
   */
  setFromRoute(route: string): void {
    const config = this.pageConfigs[route];

    if (config) {
      this.setMetadata({
        title: config.title || 'Sistema de Gestión',
        icon: config.icon,
        subtitle: config.subtitle,
        breadcrumbs: config.breadcrumbs,
        color: config.color,
        badge: config.badge
      });
    } else {
      // Fallback a título extraído de la ruta
      const title = this.extractTitleFromRoute(route);
      this.setTitle(title);
    }
  }

  /**
   * Actualiza solo el badge (útil para notificaciones)
   */
  setBadge(badge: { text: string; color: string } | null): void {
    const currentMetadata = this.metadataSubject.value;
    this.metadataSubject.next({
      ...currentMetadata,
      badge: badge || undefined
    });
  }

  /**
   * Actualiza el subtítulo dinámicamente
   */
  setSubtitle(subtitle: string): void {
    const currentMetadata = this.metadataSubject.value;
    this.metadataSubject.next({
      ...currentMetadata,
      subtitle
    });
  }

  /**
   * Extrae un título legible de la ruta
   */
  private extractTitleFromRoute(route: string): string {
    // Eliminar slash inicial y separar por /
    const segments = route.replace(/^\//, '').split('/');

    // Tomar el último segmento y capitalizar
    const lastSegment = segments[segments.length - 1] || 'inicio';

    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Obtiene la metadata actual (síncrono)
   */
  getCurrentMetadata(): PageMetadata {
    return this.metadataSubject.value;
  }

  /**
   * Obtiene el título actual (síncrono)
   */
  getCurrentTitle(): string {
    return this.titleSubject.value;
  }

  /**
   * Registra una nueva configuración de página
   */
  registerPageConfig(route: string, config: Partial<PageMetadata>): void {
    this.pageConfigs[route] = config;
  }
}
