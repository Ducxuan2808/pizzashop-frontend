import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';
import { Pizza } from '../model/pizza';
import { Size } from '../model/size';
import { Type } from '../model/type';

@Injectable({
    providedIn:'root'
})

export class TypeService{
    private apiGetTypes = `${environment.apiBaseUrl}/types`;

    constructor(private http:HttpClient){}

    getTypes():Observable<Type[]>{
        return this.http.get<Type[]>(this.apiGetTypes);
    }
    updateSizeDetail(typeId:number){
        return this.http.get(`${environment.apiBaseUrl}/types/${typeId}`);
    }
    getTypesById(typeId:number){
        return this.http.get<Pizza>(`${this.apiGetTypes}/${typeId}`);
    }
    
    // Method to create a new type
    createType(typeData: any): Observable<any> {
        return this.http.post<any>(this.apiGetTypes, typeData);
    }
    
    // Method to update an existing type
    updateType(typeId: number, typeData: any): Observable<any> {
        return this.http.put<any>(`${this.apiGetTypes}/${typeId}`, typeData);
    }
    
    // Method to delete a type
    deleteType(typeId: number): Observable<any> {
        return this.http.delete<any>(`${this.apiGetTypes}/${typeId}`);
    }
}