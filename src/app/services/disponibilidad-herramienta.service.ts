import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DisponibilidadDto {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DisponibilidadHerramientaService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/EstadoDisponibilidad`;

  constructor(private http: HttpClient) { }

  getDisponibilidades(): Observable<{ data: DisponibilidadDto[]; total: number }> {
    return this.http.get<{ data: DisponibilidadDto[]; total: number }>(`${this.baseUrl}`);
  }

  getDisponibilidadById(id: number): Observable<{ data: DisponibilidadDto }> {
    return this.http.get<{ data: DisponibilidadDto }>(`${this.baseUrl}/${id}`);
  }

  createDisponibilidad(data: Partial<DisponibilidadDto>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, data);
  }

  updateDisponibilidad(id: number, data: Partial<DisponibilidadDto>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, data);
  }

  deleteDisponibilidad(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  getDisponibilidadesPaged(page: number = 1, pageSize: number = 10): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}?page=${page}&pageSize=${pageSize}`);
  }
}
