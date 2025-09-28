import { Routes } from '@angular/router';
import { Roles } from '../../shared/enums/roles';

export const usuariosRoutes: Routes = [
  {
    path: '',
    redirectTo: 'listado',
    pathMatch: 'full'
  },
  {
    path: 'listado',
    loadComponent: () => import('./listado/listado.component').then(m => m.ListadoComponent),
    data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
  },
  {
    path: 'alta',
    loadComponent: () => import('./alta/alta.component').then(m => m.AltaComponent),
    data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
  },
  {
    path: 'roles',
    loadComponent: () => import('./roles/roles.component').then(m => m.RolesComponent),
    data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
  }
];
