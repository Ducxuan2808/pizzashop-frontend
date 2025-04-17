import { Membership } from "../../model/membership";
import { Role } from "../../model/role";

export interface UserResponse {
    id: number;
    full_name: string;
    address:string;
    is_active: boolean;
    date_of_birth: Date;
    email: string;
    phone: string;
    role: Role;
    membership: Membership;
}