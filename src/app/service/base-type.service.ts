import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class BaseTypeService {
  private apiUrl = `${environment.apiBaseUrl}/types`;

  constructor(private http: HttpClient) { }

  getBaseTypes(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getBaseTypeById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createBaseType(baseType: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, baseType);
  }

  updateBaseType(id: number, baseType: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, baseType);
  }

  deleteBaseType(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
} 