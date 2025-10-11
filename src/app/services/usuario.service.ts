import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CreateUserDTO } from '../models/user.dto';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  // Use environment.apiUrl for dev/prod y apuntar al endpoint real '/usuario' (lowercase según backend)
  private baseUrl = (environment?.apiUrl ? environment.apiUrl : '') + '/usuario';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene usuarios paginados y opcionalmente filtrados.
   * Parámetros de filtro aceptados (opcionales): legajo, estado, nombre, apellido, rol
   * Ejemplo:
   *   // Desde el frontend pueden llamar:
   *   userService.getUsers(1, 10, { nombre: 'Juan', estado: true });
   * Equivalente a GET /api/usuario?page=1&pageSize=10&nombre=Juan&estado=true
   */
  getUsers(
    page: number = 1,
    pageSize: number = 10,
    filters?: { legajo?: string; estado?: boolean; nombre?: string; apellido?: string; rol?: number }
  ): Observable<{ data: any[]; total: number }> {
    let params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());

    // Añadir filtros opcionales si fueron provistos
    if (filters) {
      if (filters.legajo !== undefined && filters.legajo !== null && String(filters.legajo).trim() !== '') {
        params = params.set('legajo', String(filters.legajo));
      }
      if (filters.estado !== undefined && filters.estado !== null) {
        // enviar como 'true' / 'false'
        params = params.set('estado', String(filters.estado));
      }
      if (filters.nombre !== undefined && filters.nombre !== null && String(filters.nombre).trim() !== '') {
        params = params.set('nombre', String(filters.nombre));
      }
      if (filters.apellido !== undefined && filters.apellido !== null && String(filters.apellido).trim() !== '') {
        params = params.set('apellido', String(filters.apellido));
      }
      if (filters.rol !== undefined && filters.rol !== null && filters.rol !== 0) {
        params = params.set('rol', String(filters.rol));
      }
    }

    // Solicitamos la respuesta completa para leer headers (p. ej. X-Total-Count)
    // DEBUG: logear URL con params para ayudar a diagnosticar filtros
    try {
      const debugUrl = `${this.baseUrl}?${params.toString()}`;
      // usar console.debug para no ensuciar demasiado la consola en producción
      console.debug('[UserService] GET URL:', debugUrl);
    } catch (e) {
      // ignore
    }

    return this.http.get<any>(`${this.baseUrl}`, { params, observe: 'response' as const }).pipe(
      tap((r: any) => console.debug('[UserService] raw response:', r)),
      map(resp => {
        const body = resp.body ?? {};
        // Intenta leer header 'X-Total-Count' o 'x-total-count'
        const totalHeader = resp.headers.get('X-Total-Count') ?? resp.headers.get('x-total-count');

        // Casos comunes de shape del backend:
        // 1) { data: [ ... ], total: N }
        // 2) { data: { data: [ ... ], totalRecords: N, ... } }
        // 3) array simple [ ... ]
        let dataArray: any[] = [];
        let total = 0;

        if (totalHeader) {
          total = Number(totalHeader);
        }

        if (body && Array.isArray(body)) {
          dataArray = body as any[];
          if (!total) total = dataArray.length;
        } else if (body && body.data) {
          // body.data may be array or an object that contains data and pagination
          if (Array.isArray(body.data)) {
            dataArray = body.data;
            if (!total) total = body.total ?? dataArray.length;
          } else if (body.data.data && Array.isArray(body.data.data)) {
            // Nested: body.data.data
            dataArray = body.data.data;
            if (!total) total = body.data.totalRecords ?? body.data.total ?? dataArray.length;
          } else {
            // fallback: try items
            dataArray = body.data.items ?? [];
            if (!total) total = body.data.total ?? dataArray.length;
          }
        } else if (body.items && Array.isArray(body.items)) {
          dataArray = body.items;
          if (!total) total = body.total ?? dataArray.length;
        } else {
          // fallback: try body as array-like
          dataArray = [];
          if (!total) total = 0;
        }

        return { data: dataArray, total };
      }),
      catchError(err => {
        console.error('[UserService] getUsers error', err);
        // Fallback: devolver lista vacía y total 0 para que la UI no rompa
        return of({ data: [], total: 0 });
      })
    );
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/all-unpaginated`);
  }

  getUserById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  getUserByDni(dni: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/dni/${dni}`);
  }

  getActiveUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/active`);
  }

  createUser(user: CreateUserDTO): Observable<any> {
    return this.http.post(`${this.baseUrl}/`, user);
  }

  updateUser(id: number, user: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, user);
  }

  validateCredentials(legajo: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/validate`, { legajo, password });
  }

  /**
   * Alterna el estado activo/inactivo del usuario en el backend.
   * Llama a PATCH /Usuario/{id}/toggle-activo
   * El endpoint solo espera el id en la URL y realiza el toggle server-side.
   * No se envía body (se pasa null) para respetar la API que no requiere payload.
   */
  toggleActivo(id: number): Observable<any> {
    const url = `${this.baseUrl}/${id}/toggle-activo`;
    // No enviamos body: el backend hará el toggle basándose únicamente en el id.
    return this.http.patch(url, null);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
