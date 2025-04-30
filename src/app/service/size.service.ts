import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';

@Injectable({
    providedIn:'root'
})

export class SizeService{
    private apiUrl = `${environment.apiBaseUrl}/sizes`;

    constructor(private http:HttpClient){}

    getSizes(): Observable<any> {
        return this.http.get<any>(this.apiUrl);
    }

    getSizeById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    createSize(size: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, size);
    }

    updateSize(id: number, size: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, size);
    }

    deleteSize(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}