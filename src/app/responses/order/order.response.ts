import { OrderDetail } from "../../model/order.detail";

export interface OrderResponse {
    id: number;
    user_id: number;
    full_name: string; 
    email: string;
    phone_order: string;
    phone: string; 
    address: string;
    note: string;
    order_date: Date; 
    status: 'Pending' | 'Preparing' | 'Delivering' | 'Completed' | 'Cancelled';
    order_type: 'Online' | 'Dine-in' | 'Takeaway';
    total_money: number; 
    shipping_method: string; 
    shipping_address: string; 
    shipping_date: Date; 
    tracking_number: string; 
    payment_method: string;
    payment_status: 'paid' | 'unpaid';
    active: boolean;
    order_details: OrderDetail[];
}