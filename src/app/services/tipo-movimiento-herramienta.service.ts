import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TipoMovimientoDto {
  idTipoMovimiento: number;
  nombreTipoMovimiento: string;
}

@Injectable({
  providedIn: 'root'
})
export class TipoMovimientoHerramientaService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/TipoMovimientoHerramienta`;

  constructor(private http: HttpClient) { }

  getTiposMovimiento(): Observable<{ data: TipoMovimientoDto[]; success: boolean; message: string; errors: any[] }> {
    return this.http.get<{ data: TipoMovimientoDto[]; success: boolean; message: string; errors: any[] }>(`${this.baseUrl}`);
  }

  getTipoMovimientoById(id: number): Observable<{ data: TipoMovimientoDto }> {
    return this.http.get<{ data: TipoMovimientoDto }>(`${this.baseUrl}/${id}`);
  }

  createTipoMovimiento(data: Partial<TipoMovimientoDto>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, data);
  }

  updateTipoMovimiento(id: number, data: Partial<TipoMovimientoDto>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, data);
  }

  deleteTipoMovimiento(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  getTiposMovimientoPaged(page: number = 1, pageSize: number = 10): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}?page=${page}&pageSize=${pageSize}`);
  }
}
