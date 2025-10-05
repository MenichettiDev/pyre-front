import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  // Use environment.apiUrl for dev/prod and apuntar al endpoint real '/Usuario'
  private baseUrl = (environment?.apiUrl ? environment.apiUrl : '') + '/Usuario';

  constructor(private http: HttpClient) {}

  getUsers(page: number = 1, pageSize: number = 10): Observable<{ data: any[]; total: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    // Solicitamos la respuesta completa para leer headers (p. ej. X-Total-Count)
    return this.http.get<any>(`${this.baseUrl}`, { params, observe: 'response' as const }).pipe(
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

  createUser(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/`, user);
  }

  updateUser(id: number, user: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, user);
  }

  validateCredentials(legajo: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/validate`, { legajo, password });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
