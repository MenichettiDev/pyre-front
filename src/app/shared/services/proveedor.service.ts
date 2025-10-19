import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProveedorService {
    private apiUrl = environment.apiUrl;
    private baseUrl = `${this.apiUrl}/Proveedor`;

    constructor(private http: HttpClient) { }

    getProveedores(onlyActive: boolean = true): Observable<any[]> {
        let params = new HttpParams();
        if (onlyActive) {
            params = params.set('activo', 'true');
        }

        return this.http.get<any>(`${this.baseUrl}`, { params }).pipe(
            map(response => {
                // Handle different response formats
                if (Array.isArray(response)) {
                    return response;
                }
                if (response && Array.isArray(response.data)) {
                    return response.data;
                }
                if (response && response.success && Array.isArray(response.data)) {
                    return response.data;
                }
                return [];
            }),
            catchError(error => {
                console.error('Error fetching proveedores:', error);
                return of([]);
            })
        );
    }

    searchProveedores(searchTerm: string, onlyActive: boolean = true): Observable<any[]> {
        let params = new HttpParams()
            .set('search', searchTerm);

        if (onlyActive) {
            params = params.set('activo', 'true');
        }

        return this.http.get<any>(`${this.baseUrl}/search`, { params }).pipe(
            map(response => {
                // Handle different response formats
                if (Array.isArray(response)) {
                    return response;
                }
                if (response && Array.isArray(response.data)) {
                    return response.data;
                }
                if (response && response.success && Array.isArray(response.data)) {
                    return response.data;
                }
                return [];
            }),
            catchError(error => {
                console.error('Error searching proveedores:', error);
                return of([]);
            })
        );
    }

    getProveedorById(id: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
            map(response => {
                if (response && response.data) {
                    return response.data;
                }
                return response;
            }),
            catchError(error => {
                console.error('Error fetching proveedor by id:', error);
                return of(null);
            })
        );
    }
}
