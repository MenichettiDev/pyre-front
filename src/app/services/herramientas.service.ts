import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HerramientaService {

  private baseUrl = (environment?.apiUrl ? environment.apiUrl : '') + '/Herramienta';


  constructor(private http: HttpClient) { }

  /**
   * Obtiene herramientas paginadas. Parámetros disponibles: page, pageSize, search
   */
  getTools(page: number = 1, pageSize: number = 5, search?: string): Observable<{ data: any[]; total: number }> {
    let params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());

    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }

    return this.http.get<any>(`${this.baseUrl + '/paged'}`, { params }).pipe(
      map((resp: any) => {
        // El backend devuelve { success, data: { data: [...], totalRecords, ... }, message }
        const payload = resp?.data ?? resp;
        const items = payload?.data ?? payload ?? [];
        const total = payload?.totalRecords ?? payload?.total ?? (Array.isArray(items) ? items.length : 0);

        // Normalizar campo 'nombre' que la tabla espera a partir de 'nombreHerramienta'
        const normalized = Array.isArray(items) ? items.map((it: any) => ({ ...it, nombre: it.nombreHerramienta ?? it.nombre })) : items;

        return { data: normalized, total } as { data: any[]; total: number };
      })
    );
  }

  getToolById(id: number): Observable<any> {
    return this.http.get(`/api/tools/${id}`);
  }

  createTool(data: any): Observable<any> {
    return this.http.post('/api/tools', data);
  }

  updateTool(id: number, data: any): Observable<any> {
    return this.http.put(`/api/tools/${id}`, data);
  }

  deleteTool(id: number): Observable<any> {
    return this.http.delete(`/api/tools/${id}`);
  }

  // Opcional: alternar estado activo/inactivo si el backend lo soporta
  toggleActivo(id: number): Observable<any> {
    return this.http.patch(`/api/tools/${id}/toggle-activo`, {});
  }

  // GET /api/Herramienta/herramientas-totales
  getHerramientasTotales(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/herramientas-totales`);
  }

  // GET /api/Herramienta/herramientas-disponibles
  getHerramientasDisponibles(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/herramientas-disponibles`);
  }

  // GET /api/Herramienta/herramientas-en-prestamo
  getHerramientasEnPrestamo(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/herramientas-en-prestamo`);
  }

  // GET /api/Herramienta/herramientas-en-reparacion
  getHerramientasEnReparacion(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/herramientas-en-reparacion`);
  }
}
