import { Routes } from '@angular/router';
import { Roles } from '../../shared/enums/roles';

export const herramientasRoutes: Routes = [
  {
    path: '',
    redirectTo: 'listado',
    pathMatch: 'full'
  },
  {
    path: 'alta',
    loadComponent: () => import('./alta/alta.component').then(m => m.AltaComponent),
    data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
  },
  {
    path: 'estados',
    loadComponent: () => import('./estados/estados.component').then(m => m.EstadosComponent),
    data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
  },
  {
    path: 'ubicacion',
    loadComponent: () => import('./ubicacion/ubicacion.component').then(m => m.UbicacionComponent),
    data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
  }
];
