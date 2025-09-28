import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'loggedInUser';

  private loggedIn = new BehaviorSubject<boolean>(this.isLoggedIn());
  loggedIn$ = this.loggedIn.asObservable();
  private apiBase = ''; // Ajustar si hace falta

  constructor(private http?: HttpClient) { }

  // Guardar token y datos del usuario
  saveAuthData(token: string, user: any): void {
    // Normalizar shape: mapear rolId/rolNombre a id_acceso
    const normalized = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido || '',
      email: user.email || user.email,
      id_acceso: user.rolId ?? user.id_acceso ?? null,
      rolNombre: user.rolNombre ?? user.rolNombre ?? null,
      avatar: user.avatar ?? null,
      raw: user
    };

    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(normalized));
    this.loggedIn.next(true);
  }

  // Intenta recargar el perfil del backend si hay token pero falta user
  async ensureProfileLoaded(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;
    if (this.getUser()) return true;

    try {
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      // Usamos HttpClient si está disponible, si no, fallback a fetch
      if (this.http) {
        const profile = await firstValueFrom(this.http.get<any>(`${this.apiBase}/auth/me`, { headers }));
        // mapear profile a la forma normalizada
        this.saveAuthData(token, profile.usuario ?? profile);
        return true;
      } else {
        const res = await fetch(`${this.apiBase}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('no profile');
        const profile = await res.json();
        this.saveAuthData(token, profile.usuario ?? profile);
        return true;
      }
    } catch (e) {
      this.logout();
      return false;
    }
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): any | null {
    const userData = sessionStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem(this.TOKEN_KEY);
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.loggedIn.next(false);
  }

  // Obtener el ID del usuario
  getUserId(): number | null {
    const user = this.getUser();
    return user && user.id ? user.id : null;
  }

  // Obtener el rol del usuario
  getUserRole(): string | null {
    const user = this.getUser();
    return user && user.rolNombre ? user.rolNombre : null;
  }
}
