import { Pizza } from "./pizza";
import { Order } from "./order";
import { Size } from "./size";
import { Type } from "./type";

export interface OrderDetail {
    id: number;
    order?: Order;
    pizza?: Pizza;
    size?: Size;
    type?: Type;
    price: number;
    quantity: number;
    note?: string;
    
    // Additional fields for admin order display
    product_id: number;
    product_name: string;
    unit_price: number;
}