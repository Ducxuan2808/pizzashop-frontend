import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';
import { TableBooking } from '../model/tablebooking';
import { TableBookingDTO } from '../dtos/tablebooking.dto';

@Injectable({
    providedIn:'root'
})

export class TableBookingService{
    private apiTableBookingship = `${environment.apiBaseUrl}/tablebookings`;

    constructor(private http:HttpClient){}

    getTableBookings():Observable<TableBooking[]>{
        return this.http.get<TableBooking[]>(this.apiTableBookingship);
    }
    createTableBooking(tableBookingDTO:TableBookingDTO){
        return this.http.post(`${environment.apiBaseUrl}/tablebookings`,tableBookingDTO);
    }
    getTableBookingsByUserId(userId:number):Observable<TableBooking[]>{
        return this.http.get<TableBooking[]>(`${this.apiTableBookingship}/user/${userId}`);
    }
    updateTableBooking(bookingId: number, tableBookingDTO: TableBookingDTO): Observable<TableBooking> {
        return this.http.put<TableBooking>(`${this.apiTableBookingship}/${bookingId}`, tableBookingDTO);
    }
}