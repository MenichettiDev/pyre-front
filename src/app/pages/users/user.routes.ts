import { Routes } from '@angular/router';
import { Roles } from '../../shared/enums/roles';

export const userRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./list/user-list.component').then(m => m.UserListComponent),
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
