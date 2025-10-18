import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MovimientoDto {

}

export interface CreateMovimientoDto {
  idHerramienta: number;
  idUsuario: number;
  idTipoMovimiento: number;
  fechaMovimiento: string;
  fechaEstimadaDevolucion?: string;
  estadoHerramientaAlDevolver?: number;
  idObra?: number;
  idProveedor?: number;
  observaciones?: string;
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



}
