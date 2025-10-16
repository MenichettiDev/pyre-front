import { Routes } from '@angular/router';
import { Roles } from '../../shared/enums/roles';

export const userRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./visor-usuario/visor-usuario.component').then((m) => m.UserListComponent),
    data: {
      requiredAccess: [
        Roles.SuperAdmin,
        Roles.Operario,
        Roles.Supervisor,
        Roles.Administrativo,
      ],
    },
  },

];
