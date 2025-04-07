import { IsString, IsNotEmpty, IsPhoneNumber, IsNumber } from "class-validator";
import { CartItemDTO } from "./cart.item.dto";

export class OrderDTO{

    user_id:number;

    full_name:string;

    order_type: string

    email:string;

    delivery_phone:string;

    delivery_address:string;

    status: string;

    note:string;

    total_price:number;

    payment_method: string;

    discount_amount: string;

    order_time: Date

    table_number: number

    shipping_time: Date

    cart_items: {product_id:number, quantity:number}[];

    constructor(data:any){
        this.user_id=data.user_id;
        this.full_name = data.full_name;
        this.order_type = data.order_type;
        this.email = data.email;
        this.delivery_phone = data.delivery_phone;
        this.delivery_address = data.delivery_address;
        this.status = data.status;
        this.note = data.note;
        this.total_price = data.total_price;
        this.order_time = data.order_time;
        this.payment_method = data.payment_method;
        this.discount_amount = data.discount_amount;
        this.table_number = data.table_number;
        this.shipping_time = data.shipping_time;
        this.cart_items = data.cart_items;
    }

}