import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: number;
  name: string;
  image?: string;
  size: string;
  type: string;
  quantity: number;
  price: number;
}

export interface CheckoutData {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  cartUpdated = new Subject<void>();
  
  // Checkout data for order page
  private checkoutDataSubject = new BehaviorSubject<CheckoutData | null>(null);
  checkoutData$ = this.checkoutDataSubject.asObservable();
  
  // Default shipping fee
  private shippingFee: number = 30000;

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
      cartItem => 
        cartItem.id === item.id && 
        cartItem.size === item.size && 
        cartItem.type === item.type
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
  
  // Method to prepare checkout data for the order page
  prepareCheckoutData(): CheckoutData {
    const subtotal = this.getTotalPrice();
    const total = subtotal + this.shippingFee;
    
    const checkoutData: CheckoutData = {
      items: [...this.cartItems],
      subtotal,
      shippingFee: this.shippingFee,
      total
    };
    
    // Save to BehaviorSubject for components to access
    this.checkoutDataSubject.next(checkoutData);
    
    // Also save to sessionStorage for persistence between page refreshes
    sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    
    return checkoutData;
  }
  
  // Method to get checkout data (from session storage if available)
  getCheckoutData(): CheckoutData | null {
    // First try to get from BehaviorSubject
    let checkoutData = this.checkoutDataSubject.getValue();
    
    // If not available, try to get from sessionStorage
    if (!checkoutData) {
      const storedData = sessionStorage.getItem('checkoutData');
      if (storedData) {
        checkoutData = JSON.parse(storedData);
        this.checkoutDataSubject.next(checkoutData);
      }
    }
    
    return checkoutData;
  }
  
  // Method to clear checkout data after order is placed
  clearCheckoutData(): void {
    debugger
    sessionStorage.removeItem('checkoutData');
    this.checkoutDataSubject.next(null);
  }
  
  // Update shipping fee (can be used if different shipping options are available)
  updateShippingFee(fee: number): void {
    this.shippingFee = fee;
    
    // Update checkout data if it exists
    const currentData = this.checkoutDataSubject.getValue();
    if (currentData) {
      const updatedData = {
        ...currentData,
        shippingFee: fee,
        total: currentData.subtotal + fee
      };
      this.checkoutDataSubject.next(updatedData);
      sessionStorage.setItem('checkoutData', JSON.stringify(updatedData));
    }
  }
} 