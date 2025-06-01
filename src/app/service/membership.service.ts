import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';
import { Membership } from '../model/membership';
import { MembershipDTO } from '../dtos/membership/membership.dto';

@Injectable({
    providedIn:'root'
})

export class MembershipService{
    private apiGetmembership = `${environment.apiBaseUrl}/membership`;

    constructor(private http:HttpClient){}

    getMemberships():Observable<Membership[]>{
        return this.http.get<Membership[]>(this.apiGetmembership);
    }
    getMembershipById(membershipId:number){
        return this.http.get<Membership>(`${this.apiGetmembership}/${membershipId}`);
    }

    getMembershipByUserPhone(phone: string){
        return this.http.get<Membership>(`${this.apiGetmembership}/phone/${phone}`);
    }
    createMembership(membership: MembershipDTO){
        return this.http.post(`${this.apiGetmembership}`, membership);
    }

    deleteMembership(phone: string): Observable<any> {
        debugger
        return this.http.delete<any>(`${this.apiGetmembership}/${phone}`);
    }

    updateMembership(membershipId: number, membership: MembershipDTO): Observable<any> {
        debugger
        return this.http.put<any>(`${this.apiGetmembership}/${membershipId}`, membership);
    }
}