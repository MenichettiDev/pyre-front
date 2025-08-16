import { Routes } from '@angular/router';
import { LoginComponent } from './pages/00-Loguin/login/login.component'; // Asegúrate de que la ruta sea correcta

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' }, // Redirige la ruta raíz a 'login'
    { path: 'login', component: LoginComponent }, // Ruta para el componente Login
];