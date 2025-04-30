import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderDTO } from '../dtos/order/order.dto';
import { PizzaService } from './pizza.service';
import { environment } from '../environments/environments';
import { OrderResponse } from '../responses/order/order.response';

@Injectable({
    providedIn:'root',
})

export class OrderService{
    private apiUrl =  `${environment.apiBaseUrl}/orders`;
    private apiGetAllOrders =  `${environment.apiBaseUrl}/orders/get-orders-by-keyword`;
    private apiUpdateOrderStatus = `${environment.apiBaseUrl}/orders/update-order-status`;
    private apiPlaceOrder = `${environment.apiBaseUrl}/orders/place-order`;

    constructor(private http:HttpClient){}

    placeOrder(orderData: OrderDTO):Observable<any>{
        debugger;
        return this.http.post(this.apiUrl,orderData);
    }
    
    getOrderById(orderId:number):Observable<any>{
        const url = `${environment.apiBaseUrl}/orders/${orderId}`;
        return this.http.get(url);
    }
    
    getAllOrders(keyword: string = '', page: number = 0, limit: number = 10): Observable<any> {
        let params = new HttpParams();
        debugger;
        if (keyword) params = params.append('keyword', keyword);
        params = params.append('page', page.toString());
        params = params.append('limit', limit.toString());
        
        return this.http.get<any>(this.apiGetAllOrders, { params });
    }
    
    updateOrder(orderId:number, orderData:OrderDTO): Observable<any>{
        debugger;
        const url =  `${environment.apiBaseUrl}/orders/${orderId}`;
        return this.http.put(url,orderData);
    }
    
    deleteOrder(orderId:number):Observable<any>{
        const url = `${environment.apiBaseUrl}/orders/${orderId}`;
        return this.http.delete(url, {responseType: 'text'});
    }

    // Create new order
    createOrder(orderData: OrderDTO): Observable<any> {
        return this.http.post<any>(this.apiPlaceOrder, orderData);
    }
}