import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TipoMovimientoService {
    private apiUrl = environment.apiUrl;
    private baseUrl = `${this.apiUrl}/TipoMovimientoHerramienta`;

    constructor(private http: HttpClient) { }

    getTiposMovimiento(onlyActive: boolean = true): Observable<any[]> {
        let params = new HttpParams();
        if (onlyActive) {
            params = params.set('activo', 'true');
        }

        return this.http.get<any>(`${this.baseUrl}`, { params }).pipe(
            map(response => {
                // Handle the response format from your example
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
                console.error('Error fetching tipos movimiento:', error);
                return of([]);
            })
        );
    }

    searchTiposMovimiento(searchTerm: string, onlyActive: boolean = true): Observable<any[]> {
        // For now, get all and filter client-side since we don't have a search endpoint
        return this.getTiposMovimiento(onlyActive).pipe(
            map(tipos => {
                return tipos.filter(tipo =>
                    tipo.nombreTipoMovimiento?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            })
        );
    }

    getTipoMovimientoById(id: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
            map(response => {
                if (response && response.data) {
                    return response.data;
                }
                return response;
            }),
            catchError(error => {
                console.error('Error fetching tipo movimiento by id:', error);
                return of(null);
            })
        );
    }
}
