import { Routes } from '@angular/router';
import { Roles } from '../../shared/enums/roles';

export const herramientaRoutes: Routes = [
    {
        path: '',
        redirectTo: 'lista', // Redirige correctamente
        pathMatch: 'full'
    },
    {
        path: 'lista', // Asegura que el path sea correcto
        loadComponent: () =>
            import('./lista/herramientas-lista.component').then(m => m.HerramientasListaComponent),
        data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
    },
    {
        path: 'ubicacion',
        loadComponent: () => import('./ubicacion/ubicacion.component').then(m => m.UbicacionComponent),
        data: { requiredAccess: [Roles.SuperAdmin, Roles.Operario, Roles.Supervisor, Roles.Administrativo] }
    }
];
