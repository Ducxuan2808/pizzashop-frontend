import { Pizza } from "./pizza";
import { Order } from "./order";
import { Size } from "./size";
import { Type } from "./type";
export interface OrderDetail {
    id: number;
    order: Order;
    pizza: Pizza;
    size: Size;
    type: Type;
    price: number;
    quantity: number;
    note: string;
}