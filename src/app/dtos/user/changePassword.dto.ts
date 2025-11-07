export class ChangPasswordDTO{
    old_password:string;
    password:string;
    retype_password:string;

    constructor(data:any){
        this.old_password = data.old_password;
        this.password = data.password;
        this.retype_password = data.retype_password;
    }
}