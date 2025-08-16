import { Routes } from '@angular/router';
import { LoginComponent } from './pages/00-Login/login/login.component'; // Asegúrate de que la ruta sea correcta

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/00-Login/login/login.component').then(m => m.LoginComponent) },
    {
        path: 'login',
        loadChildren: () => import('./pages/00-Login/login.routes').then(m => m.loginRoutes)
    },];