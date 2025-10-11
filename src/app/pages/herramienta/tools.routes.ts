import { Routes } from '@angular/router';
import { Roles } from '../../shared/enums/roles';

export const toolRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./list/tool-list.component').then(m => m.ToolListComponent),
    data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
  },
  {
    path: 'ubicacion',
    loadComponent: () => import('./ubicacion/ubicacion.component').then(m => m.UbicacionComponent),
    data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
  }
];
