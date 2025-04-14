import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';
import { TableBooking } from '../model/tablebooking';

@Injectable({
    providedIn:'root'
})

export class TableBookingService{
    private apiTableBookingship = `${environment.apiBaseUrl}/membership`;

    constructor(private http:HttpClient){}

    getTableBookings():Observable<TableBooking[]>{
        return this.http.get<TableBooking[]>(this.apiTableBookingship);
    }
    // updateSizeDetail(membershipId:number){
    //     return this.http.get(`${environment.apiBaseUrl}/membership/${membershipId}`);
    // }
    getTableBookingsByUserId(userId:number):Observable<TableBooking[]>{
        return this.http.get<TableBooking[]>(`${this.apiTableBookingship}/user/${userId}`);
    }
}