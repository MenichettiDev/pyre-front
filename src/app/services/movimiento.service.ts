import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MovimientoDto {

}

export interface CreateMovimientoDto {
  idHerramienta: number;
  idUsuarioGenera: number;
  idUsuarioResponsable: number | null;
  idTipoMovimiento: number;
  fechaMovimiento: string;
  fechaEstimadaDevolucion?: string | null;
  estadoHerramientaAlDevolver?: number | null;
  idObra?: number | null;
  idProveedor?: number | null;
  observaciones?: string | null;
}

export interface UpdateMovimientoDto {

}

@Injectable({
  providedIn: 'root'
})
export class MovimientoService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/MovimientoHerramienta`;

  constructor(private http: HttpClient) { }


  // Registrar préstamo de herramienta --->OK
  registrarPrestamo(data: CreateMovimientoDto): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, data);
  }
  // Registrar devolucion de herramienta
  registrarDevolucion(data: CreateMovimientoDto): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, data);
  }

  // Obtener movimientos por herramienta ID
  getMovimientosByHerramienta(herramientaId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/herramienta/${herramientaId}`);
  }
  // Obtener ultimo movimiento por herramienta ID
  getUltimoMovimientoByHerramienta(herramientaId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/herramienta/${herramientaId}/ultimo`);
  }

  // Obtener movimientos paginados con filtros
  getMovimientos(
    page: number,
    pageSize: number,
    filters: {
      nombreHerramienta?: string;
      familiaHerramienta?: string;
      idUsuarioGenera?: number;
      idUsuarioResponsable?: number;
      idTipoMovimiento?: number;
      idObra?: number;
      idProveedor?: number;
      idDisponibilidad?: string;
      idEstadoFisico?: string;
      fechaDesde?: string;
      fechaHasta?: string;
    }
  ): Observable<any> {
    const params = { page, pageSize, ...filters };
    return this.http.get<any>(`${this.baseUrl}`, { params });
  }
}
