import { Routes } from '@angular/router';

// Rutas para la sección "Rutinas"
export const inicioRoutes: Routes = [
    { path: 'home', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) }
];
