import { Routes } from '@angular/router';
import { Roles } from '../../shared/enums/roles';

export const movimientosRoutes: Routes = [
  {
    path: '',
    redirectTo: 'prestamo',
    pathMatch: 'full'
  },
  {
    path: 'prestamo',
    loadComponent: () => import('./prestamo/prestamo.component').then(m => m.PrestamoComponent),
    data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
  },
  {
    path: 'devolucion',
    loadComponent: () => import('./devolucion/devolucion.component').then(m => m.DevolucionComponent),
    data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
  },
  {
    path: 'historial',
    loadComponent: () => import('./historial/historial.component').then(m => m.HistorialComponent),
    data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
  },
  {
    path: 'operario',
    loadComponent: () => import('./operario/operario.component').then(m => m.OperarioComponent),
    data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
  }
];
