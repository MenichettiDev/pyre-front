import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'api/usuario';

  constructor(private http: HttpClient) {}

  getUsers(page: number = 1, pageSize: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get(`${this.baseUrl}/`, { params });
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
