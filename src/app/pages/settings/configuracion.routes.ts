import { Routes } from '@angular/router';
import { Roles } from '../../shared/enums/roles';

export const configuracionRoutes: Routes = [
  {
    path: '',
    redirectTo: 'parametros',
    pathMatch: 'full'
  },
  {
    path: 'parametros',
    loadComponent: () => import('./parametros/parametros.component').then(m => m.ParametrosComponent),
    data: { requiredAccess: [Roles.SuperAdmin] }
  },
  {
    path: 'estados',
    loadComponent: () => import('./estados/estados.component').then(m => m.EstadosComponent),
    data: { requiredAccess: [Roles.SuperAdmin] }
  },
  {
    path: 'alertas',
    loadComponent: () => import('./alertas/alertas.component').then(m => m.AlertasComponent),
    data: { requiredAccess: [Roles.SuperAdmin] }
  }
];
