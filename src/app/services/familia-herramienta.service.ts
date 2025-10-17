import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FamiliaHerramientaDto {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FamiliaHerramientaService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/FamiliaHerramientas`;

  constructor(private http: HttpClient) { }

  getFamilias(): Observable<{ data: FamiliaHerramientaDto[]; total: number }> {
    return this.http.get<{ data: FamiliaHerramientaDto[]; total: number }>(`${this.baseUrl}`);
  }

  getFamiliaById(id: number): Observable<{ data: FamiliaHerramientaDto }> {
    return this.http.get<{ data: FamiliaHerramientaDto }>(`${this.baseUrl}/${id}`);
  }

  createFamilia(data: Partial<FamiliaHerramientaDto>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, data);
  }

  updateFamilia(id: number, data: Partial<FamiliaHerramientaDto>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, data);
  }

  deleteFamilia(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  getFamiliasPaged(page: number = 1, pageSize: number = 10): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}?page=${page}&pageSize=${pageSize}`);
  }
}
