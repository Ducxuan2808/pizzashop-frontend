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
        debugger
        return this.http.get<Type[]>(this.apiGetTypes);
    }
    updateSizeDetail(pizzaId:number){
        return this.http.get(`${environment.apiBaseUrl}/types/${pizzaId}`);
    }
    getTypesById(typeId:number){
        return this.http.get<Pizza>(`${this.apiGetTypes}/${typeId}`);
    }
}