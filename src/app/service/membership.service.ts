import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';
import { Membership } from '../model/membership';

@Injectable({
    providedIn:'root'
})

export class MembershipService{
    private apiGetmembership = `${environment.apiBaseUrl}/membership`;

    constructor(private http:HttpClient){}

    getMemberships():Observable<Membership[]>{
        return this.http.get<Membership[]>(this.apiGetmembership);
    }
    updateSizeDetail(membershipId:number){
        return this.http.get(`${environment.apiBaseUrl}/membership/${membershipId}`);
    }
    getMembershipById(membershipId:number){
        return this.http.get<Membership>(`${this.apiGetmembership}/${membershipId}`);
    }

    getMembershipByUserPhone(phone: string){
        return this.http.get<Membership>(`${this.apiGetmembership}/phone/${phone}`);
    }
}