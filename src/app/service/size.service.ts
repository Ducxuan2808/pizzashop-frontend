import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';
import { Pizza } from '../model/pizza';
import { Size } from '../model/size';

@Injectable({
    providedIn:'root'
})

export class SizeService{
    private apiGetSizes = `${environment.apiBaseUrl}/sizes`;

    constructor(private http:HttpClient){}

    getSizes():Observable<Size[]>{
        debugger
        return this.http.get<Size[]>(this.apiGetSizes);
    }
    updateSizeDetail(sizeId:number){
        return this.http.get(`${environment.apiBaseUrl}/sizes/${sizeId}`);
    }
    getSizesById(sizeId:number){
        return this.http.get<Pizza>(`${this.apiGetSizes}/${sizeId}`);
    }
}