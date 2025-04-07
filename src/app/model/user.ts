export interface User{
    id: number;
    username: string;
    password: string;
    full_name: string;
    email: string;
    phone: string;
    address: string;
    date_of_birth: Date;
    is_active: boolean;
    role_id: number;
}