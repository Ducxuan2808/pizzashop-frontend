import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';
import { Pizza } from '../model/pizza';
import { PizzaDTO } from '../dtos/pizza/pizza.dto';

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

    worstSellPizzas():Observable<Pizza[]>{
        debugger
        return this.http.get<Pizza[]>(`${this.apiGetPizzas}/worst-seller`);
    }
    updatePizza(pizzaId: number, pizzaDTO: PizzaDTO): Observable<any> {
        return this.http.put<any>(`${this.apiGetPizzas}/${pizzaId}`, pizzaDTO);
    }
    createPizzaImage(pizzaId: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('files', file, file.name);
        return this.http.post<any>(
          `${this.apiGetPizzas}/uploads/${pizzaId}`,
          formData
        );
    }
    
    deletePizza(pizzaId: number): Observable<any> {
        return this.http.delete<any>(`${this.apiGetPizzas}/${pizzaId}`);
    }

    createPizza(pizzaDTO: PizzaDTO): Observable<any> {
        return this.http.post<any>(`${this.apiGetPizzas}`, pizzaDTO);
    }

    getCountSoldByPizzaId(pizzaId:number):Observable<any>{
        return this.http.get(`${environment.apiBaseUrl}/pizzas/count-sold/${pizzaId}`);
    }

}