import { IsNumber, IsString } from "class-validator";

export class CartItemDTO{
    @IsNumber()
    pizza_id: number;

    @IsNumber()
    size_id: number;

    @IsNumber()
    base_id:  number;

    @IsNumber()
    quantity:  number;

    @IsNumber()
    price:  number;

    @IsString()
    note: string


    constructor(data:any){
        this.pizza_id = data.pizza_id;
        this.size_id = data.size_id;
        this.base_id = data.base_id;
        this.quantity = data.quantity;
        this.price = data.price;
        this.note = data.note;
    }
}