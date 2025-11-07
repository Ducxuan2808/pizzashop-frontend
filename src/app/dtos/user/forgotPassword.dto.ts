export class ForgotPasswordDTO{
    email: string;
    phone: string;
    password: string;
    retype_password: string;

    constructor(data: any){
        this.email = data.email;
        this.phone = data.phone;
        this.password = data.password;
        this.retype_password = data.retype_password;
    }
}