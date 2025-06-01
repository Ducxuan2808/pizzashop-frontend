import{
    IsString, 
    IsNotEmpty, 
    IsPhoneNumber, 
    IsDate
    
}from 'class-validator';
export class LoginDTO{
    @IsPhoneNumber()
    phone : string;

    @IsString()
    @IsNotEmpty()
    password: string;


    constructor(data: any){
        this.phone = data.phone;
        this.password = data.password;

    }
}