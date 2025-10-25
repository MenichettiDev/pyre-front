import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Solo agregar token a las peticiones de la API (excepto login)
    if (req.url.includes('/api/') && !req.url.includes('/auth/login')) {
        const token = authService.getToken();

        if (token && !authService.isTokenExpired()) {
            // Clonar la request y agregar el header de autorización
            const authReq = req.clone({
                setHeaders: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return next(authReq).pipe(
                catchError((error: HttpErrorResponse) => {
                    if (error.status === 401) {
                        authService.logout();
                        router.navigate(['/login']);
                    } else if (error.status === 403) {
                        // Acceso denegado - Sin permisos suficientes
                    }
                    return throwError(() => error);
                })
            );
        } else {
            // Si no hay token válido para peticiones API protegidas
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => new Error('No hay token válido'));
        }
    }

    // Para peticiones que no son de API o son de login, continuar sin modificar
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && req.url.includes('/api/')) {
                authService.logout();
                router.navigate(['/login']);
            }
            return throwError(() => error);
        })
    );
};
