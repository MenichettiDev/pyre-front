import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

interface LoginResponse {
  status: number;
  message: string;
  token: string;
  usuario: {
    id: number;
    nombre: string;
    email: string;
    rolId: number;
    rolNombre: string;
    avatar: string | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl = environment.apiUrl; // Usa la URL del entorno

  constructor(
    private http: HttpClient
  ) { }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password });
  }

}