import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, switchMap } from 'rxjs/operators';
import { of, from } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  // Si hay token pero user no cargado, intentar recargar el perfil
  const token = authService.getToken();

  const check$ = (isLoggedIn: boolean) => {
    if (!isLoggedIn) {
      router.navigate(['/login/login']);
      return of(false);
    }

    // Construir la lista efectiva de accesos permitidos combinando (intersección)
    // las restricciones encontradas desde state.root hasta el nodo destino.
    let effectiveAllowed: number[] | undefined = undefined;
    try {
      let node: any = state.root || null;
      // Recorrer desde la raíz hasta el nodo más profundo
      while (node) {
        const nodeRA = node.data?.['requiredAccess'] as number[] | undefined;
        if (nodeRA && nodeRA.length > 0) {
          if (!effectiveAllowed) {
            effectiveAllowed = [...nodeRA];
          } else {
            effectiveAllowed = effectiveAllowed.filter(x => nodeRA.includes(x));
          }
        }

        if (!node.firstChild) break;
        node = node.firstChild;
      }
    } catch (e) {
      // Fallback: usar route/children si state no está disponible
      let current = route;
      while (current) {
        const nodeRA = current.data?.['requiredAccess'] as number[] | undefined;
        if (nodeRA && nodeRA.length > 0) {
          if (!effectiveAllowed) {
            effectiveAllowed = [...nodeRA];
          } else {
            effectiveAllowed = effectiveAllowed.filter(x => nodeRA.includes(x));
          }
        }
        if (!current.firstChild) break;
        current = current.firstChild;
      }
    }

    // Si no hay restricción en ningún nivel, permitir por defecto
    if (!effectiveAllowed || effectiveAllowed.length === 0) {
      return of(true);
    }

    const user = authService.getUser();
    const userAccess = user?.id_acceso != null ? Number(user.id_acceso) : null;

    console.debug('[authGuard] effectiveAllowed=', effectiveAllowed, 'userAccess=', userAccess);

    if (userAccess != null && effectiveAllowed.includes(userAccess)) {
      return of(true);
    }

    // Usuario logueado pero sin permisos -> acceso denegado
    router.navigate(['/acceso-denegado']);
    return of(false);
  };

  if (token && !authService.getUser()) {
    // Intentar recargar perfil y luego verificar
    return from(authService.ensureProfileLoaded()).pipe(
      switchMap((ok) => ok ? authService.loggedIn$.pipe(switchMap(check$)) : of(false))
    );
  }

  return authService.loggedIn$.pipe(switchMap(check$));
};
