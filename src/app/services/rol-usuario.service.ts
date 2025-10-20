import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RolDto {
  idRol: number;
  nombreRol: string;
  descripcion?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RolUsuarioService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/Rol`;

  constructor(private http: HttpClient) { }

  getRoles(): Observable<{
    data: RolDto[];
    success: boolean;
    message: string;
    errors: any[];
  }> {
    return this.http.get<{
      data: RolDto[];
      success: boolean;
      message: string;
      errors: any[];
    }>(`${this.baseUrl}`);
  }

  getRolById(id: number): Observable<{ data: RolDto }> {
    return this.http.get<{ data: RolDto }>(`${this.baseUrl}/${id}`);
  }

  createRol(data: Partial<RolDto>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, data);
  }

  updateRol(id: number, data: Partial<RolDto>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, data);
  }

  deleteRol(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  getRolesPaged(page: number = 1, pageSize: number = 10): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}?page=${page}&pageSize=${pageSize}`);
  }
}
