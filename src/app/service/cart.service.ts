import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pizza } from '../model/pizza';
import { PizzaService } from './pizza.service';

@Injectable({
    providedIn:'root',
})

export class CartService{
    private cart: Map<string, {pizzaId: number, sizeId: number, typeId: number, quantity: number, price: number}> = new Map();
    constructor(){
        this.refreshCart();
    }
    public refreshCart(){
        const storedCart = localStorage.getItem(this.getCartKey());
        if(storedCart){
            this.cart = new Map(JSON.parse(storedCart));
        }else{
            this.cart = new Map<string, {pizzaId: number, sizeId: number, typeId: number, quantity: number, price: number}>();
        }
    }
    private getCartKey():string{
        
        const userResponseJSON = localStorage.getItem('user');
        const userResponse = JSON.parse(userResponseJSON!);
        debugger
        return `cart:${userResponse?.id??''}`;
        
    }
    addToCart(pizzaId:number, sizeId:number, typeId:number, quantity:number=1, price: number):void{
        debugger
       // Create a unique key for this pizza configuration
       const cartItemKey = `${pizzaId}-${sizeId}-${typeId}`;
        
       if (this.cart.has(cartItemKey)) {
           const existingItem = this.cart.get(cartItemKey)!;
           existingItem.quantity += quantity;
           this.cart.set(cartItemKey, existingItem);
       } else {
           this.cart.set(cartItemKey, {
               pizzaId,
               sizeId,
               typeId,
               quantity,
               price
           });
       }
        this.saveCartToLocalStorage();
    }

    getCart(): Map<string, {pizzaId: number, sizeId: number, typeId: number, quantity: number, price: number}> {
        return this.cart;
    }

    private saveCartToLocalStorage():void{
        debugger
        localStorage.setItem(this.getCartKey(), JSON.stringify(Array.from(this.cart.entries())));
    }

    clearCart():void{
        debugger;
        this.cart.clear();
        this.saveCartToLocalStorage();
    }
    setCart(cart: Map<string, {pizzaId: number, sizeId: number, typeId: number, quantity: number, price: number}>) {
        this.cart = cart ?? new Map<string, {pizzaId: number, sizeId: number, typeId: number, quantity: number, price: number}>();
        this.saveCartToLocalStorage();
    }
}