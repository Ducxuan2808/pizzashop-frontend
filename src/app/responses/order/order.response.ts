import { OrderDetail } from "../../model/order.detail";

export interface OrderResponse{
    id: number;
    user_id: number;
    full_name: string; 
    email: string;
    phone: string; 
    address: string;
    note: string;
    order_date: Date; 
    status: string;
    total_money: number; 
    shipping_method: string; 
    shipping_address: string; 
    shipping_date: Date; 
    tracking_number: string; 
    payment_method: string; 
    active: boolean;
    order_details: OrderDetail[];
}