import { PizzaImage } from "./pizza.image"
export interface Pizza{
    id: number;
    name: string;
    price: number;
    title: string;
    base_price: number;
    thumbnail: string;
    url: string;
    description: string;
    pizza_images: PizzaImage[];

}