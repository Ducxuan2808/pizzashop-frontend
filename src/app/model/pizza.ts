import { PizzaImage } from "./pizza.image"
import { Size } from "./size";
import { Type } from "./type";

export interface Pizza{
    id: number;
    name: string;
    title: string;
    base_price: number;
    thumbnail: string;
    url: string;
    description: string;
    pizza_images: PizzaImage[];
    sizes: Size[];
    crusts: Type[];
}