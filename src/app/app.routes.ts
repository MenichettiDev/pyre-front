import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadChildren: () => import('./pages/auth/login.routes').then(m => m.loginRoutes)
    },
    // {
    //     path: 'inicio',
    //     loadChildren: () => import('./pages/home/inicio.routes').then(m => m.inicioRoutes),
    //     canActivate: [authGuard]
    // },
    {
        path: 'dashboard',
        loadChildren: () => import('./pages/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
        canActivate: [authGuard]
    },
    {
        path: 'herramientas',
        loadChildren: () => import('./pages/herramienta/herramientas.routes').then(m => m.herramientaRoutes),
        canActivate: [authGuard]
    },
    {
        path: 'movimientos',
        loadChildren: () => import('./pages/movimientos/movimientos.routes').then(m => m.movimientosRoutes),
        canActivate: [authGuard]
    },
    {
        path: 'usuarios',
        loadChildren: () => import('./pages/usuario/usuarios.routes').then(m => m.userRoutes),
        canActivate: [authGuard],
        data: { requiredAccess: [1, 2, 3, 4] } // Todos los roles pueden acceder
    },
    {
        path: 'reportes',
        loadChildren: () => import('./pages/reportes/reportes.routes').then(m => m.reportesRoutes),
        canActivate: [authGuard],
        data: { requiredAccess: [1] } // Solo administradores
    },
    {
        path: 'recursos',
        loadChildren: () => import('./pages/recursos/recursos.routes').then(m => m.recursosRoutes)
    },
    {
        path: 'acceso-denegado',
        loadComponent: () => import('./shared/components/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
    },
    // Redirección por defecto para rutas no encontradas
    { path: '**', redirectTo: '/dashboard' }
];
