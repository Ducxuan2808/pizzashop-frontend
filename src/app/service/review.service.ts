import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';
import { Pizza } from '../model/pizza';
import { PizzaDTO } from '../dtos/pizza/pizza.dto';
import { ReviewDTO } from '../dtos/review/review.dto';

@Injectable({
    providedIn:'root'
})

export class ReviewService{
    private apiGetReview = `${environment.apiBaseUrl}/review`;

    constructor(private http:HttpClient){}

    
    getReviewByPizzaId(pizzaId:number[]):Observable<any[]>{
        debugger
        return this.http.get<any[]>(`${this.apiGetReview}/pizza/${pizzaId}`);
    }

    getReviewByOrderId(orderId:number):Observable<any[]>{
        debugger
        return this.http.get<any[]>(`${this.apiGetReview}/order/${orderId}`);
    }

    getReviewByOrderDetailId(orderDetailId:number):Observable<any>{
        debugger
        return this.http.get<any>(`${this.apiGetReview}/${orderDetailId}`);
    }

    updatePizza(reviewId: number, reviewDTO: ReviewDTO): Observable<any> {
        return this.http.put<any>(`${this.apiGetReview}/${reviewId}`, reviewDTO);
    }   
    
    deleteReview(reviewId: number): Observable<any> {
        return this.http.delete<any>(`${this.apiGetReview}/${reviewId}`);
    }

    createPizza(reviewDTO: ReviewDTO): Observable<any> {
        return this.http.post<any>(`${this.apiGetReview}`, reviewDTO);
    }

    getCountReviewByPizzaId(pizzaId:number):Observable<any>{
        return this.http.get(`${environment.apiBaseUrl}/review/count-review/${pizzaId}`);
    }
}