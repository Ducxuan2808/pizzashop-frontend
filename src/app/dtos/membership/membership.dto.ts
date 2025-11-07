import { IsNumber, IsString } from "class-validator";

export class MembershipDTO{
    phone: string;

    @IsNumber()
    total_spent: number;

    membership_tier:  string;

    @IsNumber()
    discount_rate:  number;



    constructor(data:any){
        this.phone = data.phone;
        this.total_spent = data.total_spent;
        this.membership_tier = data.membership_tier;
        this.discount_rate = data.discount_rate;
    }
}