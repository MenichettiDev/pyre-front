import { Routes } from '@angular/router';
import { Roles } from '../../shared/enums/roles';

export const herramientaRoutes: Routes = [
    {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
    },
    {
        path: 'list',
        loadComponent: () =>
            import('./visor-herramientas/visor-herramientas.component').then(m => m.VisorHerramientasComponent),
        data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
    }
];
