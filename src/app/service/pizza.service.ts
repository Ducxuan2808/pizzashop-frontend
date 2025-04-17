import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';
import { Pizza } from '../model/pizza';

@Injectable({
    providedIn:'root'
})

export class PizzaService{
    private apiGetPizzas = `${environment.apiBaseUrl}/pizzas`;

    constructor(private http:HttpClient){}

    getPizzas(sortBy:string, minPrice:number, maxPrice:number, keyword:string,
                page:number,limit:number
    ):Observable<Pizza[]>{
        const params = new HttpParams()
        .set('sort_by', sortBy)
        .set('min_price', minPrice)
        .set('max_price', maxPrice)
        .set('keyword', keyword)
        .set('page', page.toString())
        .set('limit',limit.toString());
        return this.http.get<Pizza[]>(this.apiGetPizzas,{ params });
    }
    getDetailPizza(pizzaId:number){
        return this.http.get(`${environment.apiBaseUrl}/pizzas/${pizzaId}`);
    }
    getPizzasByIds(pizzaIds:number[]):Observable<Pizza[]>{
        debugger
        const params = new HttpParams().set('ids', pizzaIds.join(','));
        return this.http.get<Pizza[]>(`${this.apiGetPizzas}/by-ids`,{params});
    }

    bestSellPizzas():Observable<Pizza[]>{
        debugger
        return this.http.get<Pizza[]>(`${this.apiGetPizzas}/best-seller`);
    }
}