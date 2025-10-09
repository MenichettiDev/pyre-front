import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProveedorDto {
  idProveedor: number;
  nombreProveedor: string;
  contacto: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/Proveedor`;

  constructor(private http: HttpClient) { }

  getProveedores(): Observable<{ data: ProveedorDto[]; total: number }> {
    return this.http.get<{ data: ProveedorDto[]; total: number }>(`${this.baseUrl}`);
  }

  getProveedorById(id: number): Observable<{ data: ProveedorDto }> {
    return this.http.get<{ data: ProveedorDto }>(`${this.baseUrl}/${id}`);
  }

  createProveedor(data: Partial<ProveedorDto>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, data);
  }

  updateProveedor(id: number, data: Partial<ProveedorDto>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, data);
  }

  deleteProveedor(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
