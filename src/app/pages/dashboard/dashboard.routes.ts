import { Routes } from '@angular/router';
import { Roles } from '../../shared/enums/roles';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'alertas',
    loadComponent: () => import('./alertas/alertas.component').then(m => m.AlertasComponent),
    data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
  },
  {
    path: 'resumen',
    loadComponent: () => import('./resumen/resumen.component').then(m => m.ResumenComponent),
    data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
  }
];
