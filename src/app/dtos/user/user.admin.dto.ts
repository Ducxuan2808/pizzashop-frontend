export class UserAdminDTO{
    phone: string;
    full_name:string;
    address:string;
    password:string;
    retype_password:string;
    date_of_birth:Date;
    role_id: number;

    constructor(data:any){
        this.phone = data.phone,
        this.full_name = data.full_name;
        this.address = data.address;
        this.password = data.password;
        this.retype_password = data.retype_password;
        this.date_of_birth = data.date_of_birth;
        this.role_id = data.roleId;
    }
}