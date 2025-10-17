import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EstadoFisicoDto {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EstadoFisicoHerramientaService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/EstadoFisicoHerramienta`;

  constructor(private http: HttpClient) { }

  getEstadosFisicos(): Observable<{ data: EstadoFisicoDto[]; total: number }> {
    return this.http.get<{ data: EstadoFisicoDto[]; total: number }>(`${this.baseUrl}`);
  }

  getEstadoFisicoById(id: number): Observable<{ data: EstadoFisicoDto }> {
    return this.http.get<{ data: EstadoFisicoDto }>(`${this.baseUrl}/${id}`);
  }

  createEstadoFisico(data: Partial<EstadoFisicoDto>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, data);
  }

  updateEstadoFisico(id: number, data: Partial<EstadoFisicoDto>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, data);
  }

  deleteEstadoFisico(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  getEstadosFisicosPaged(page: number = 1, pageSize: number = 10): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}?page=${page}&pageSize=${pageSize}`);
  }
}
