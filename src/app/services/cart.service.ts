import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CartItem } from '../models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  cartUpdated = new Subject<void>();

  constructor() {
    this.loadCartFromStorage();
  }

  private loadCartFromStorage(): void {
    const cartData = localStorage.getItem('cart');
    if (cartData) {
      this.cartItems = JSON.parse(cartData);
    }
  }

  private saveCartToStorage(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
    this.cartUpdated.next();
  }

  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  addToCart(item: CartItem): void {
    const existingItemIndex = this.cartItems.findIndex(
      cartItem => cartItem.id === item.id && cartItem.size === item.size && cartItem.type === item.type
    );

    if (existingItemIndex >= 0) {
      this.cartItems[existingItemIndex].quantity += item.quantity;
    } else {
      this.cartItems.push({ ...item });
    }

    this.saveCartToStorage();
  }

  updateItemQuantity(itemId: number, quantity: number): void {
    const index = this.cartItems.findIndex(item => item.id === itemId);
    if (index >= 0) {
      this.cartItems[index].quantity = quantity;
      this.saveCartToStorage();
    }
  }

  removeItem(itemId: number): void {
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    this.saveCartToStorage();
  }

  clearCart(): void {
    this.cartItems = [];
    this.saveCartToStorage();
  }

  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice(): number {
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
} 