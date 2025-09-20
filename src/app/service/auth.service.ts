import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'loggedInUser';

  private loggedIn = new BehaviorSubject<boolean>(this.isLoggedIn());
  loggedIn$ = this.loggedIn.asObservable();

  constructor() { }

  // Guardar token y datos del usuario
  saveAuthData(token: string, user: any): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.loggedIn.next(true);
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
