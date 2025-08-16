import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environmet'; // Ajusta la ruta según tu estructura

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl = environment.apiUrl; // Usa la URL del entorno

  constructor(
    private http: HttpClient
  ) { }

  login(usuario: string, contrasenia: string) {
    return this.http.post(`${this.apiUrl}/login`, { usuario, contrasenia });
  }

}