import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

export interface CartItem {
  pizzaId: number;
  sizeId: number;
  typeId: number;
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
  private previousUserId: string | null = null;
  
  // Checkout data for order page
  private checkoutDataSubject = new BehaviorSubject<CheckoutData | null>(null);
  checkoutData$ = this.checkoutDataSubject.asObservable();
  
  // Default shipping fee
  private shippingFee: number = 30000;

  constructor() {
    this.loadCartFromStorage();
    // Check for user changes periodically to handle login/logout
    this.setupUserChangeDetection();
  }

  // Setup periodic check for user changes
  private setupUserChangeDetection(): void {
    // Check every 2 seconds if the user has changed
    setInterval(() => {
      const currentUserId = this.getUserId();
      if (this.previousUserId !== currentUserId) {
        // User has changed, reload cart
        this.previousUserId = currentUserId;
        this.loadCartFromStorage();
      }
    }, 2000);
  }

  private getUserId(): string | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        return userData.id?.toString();
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  private getCartKey(): string {
    const userId = this.getUserId();
    return userId ? `cart_${userId}` : 'cart_guest';
  }

  private loadCartFromStorage(): void {
    const cartKey = this.getCartKey();
    const cartData = localStorage.getItem(cartKey);
    if (cartData) {
      try {
        this.cartItems = JSON.parse(cartData);
        console.log(`Loaded cart for ${cartKey}:`, this.cartItems);
      } catch (error) {
        console.error(`Error parsing cart data for ${cartKey}:`, error);
        this.cartItems = [];
      }
    } else {
      this.cartItems = [];
    }
    // Notify subscribers that cart has been updated
    this.cartUpdated.next();
  }

  private saveCartToStorage(): void {
    const cartKey = this.getCartKey();
    localStorage.setItem(cartKey, JSON.stringify(this.cartItems));
    this.cartUpdated.next();
  }

  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  addToCart(item: CartItem): void {
    const existingItemIndex = this.cartItems.findIndex(
      cartItem => 
        cartItem.pizzaId === item.pizzaId && 
        cartItem.sizeId === item.sizeId && 
        cartItem.typeId === item.typeId
    );

    if (existingItemIndex >= 0) {
      this.cartItems[existingItemIndex].quantity += item.quantity;
    } else {
      this.cartItems.push({ ...item });
    }

    this.saveCartToStorage();
  }

  updateItemQuantity(pizzaId: number, quantity: number): void {
    const index = this.cartItems.findIndex(item => item.pizzaId === pizzaId);
    if (index >= 0) {
      this.cartItems[index].quantity = quantity;
      this.saveCartToStorage();
    }
  }

  removeItem(pizzaId: number): void {
    this.cartItems = this.cartItems.filter(item => item.pizzaId !== pizzaId);
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
  
  // Method to manually refresh cart data (can be called after login/logout)
  refreshCart(): void {
    this.loadCartFromStorage();
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

  // Method to merge guest cart with user cart after login
  mergeGuestCartWithUserCart(): void {
    const guestCartData = localStorage.getItem('cart_guest');
    if (guestCartData) {
      try {
        const guestCartItems: CartItem[] = JSON.parse(guestCartData);
        if (guestCartItems.length > 0) {
          // Get current user cart
          const userId = this.getUserId();
          if (userId) {
            const userCartData = localStorage.getItem(`cart_${userId}`);
            let userCartItems: CartItem[] = [];
            
            if (userCartData) {
              userCartItems = JSON.parse(userCartData);
            }
            
            // Merge guest cart items with user cart
            guestCartItems.forEach(guestItem => {
              const existingItemIndex = userCartItems.findIndex(
                userItem => 
                  userItem.pizzaId === guestItem.pizzaId && 
                  userItem.sizeId === guestItem.sizeId && 
                  userItem.typeId === guestItem.typeId
              );
              
              if (existingItemIndex >= 0) {
                // Item already exists in user cart, add quantities
                userCartItems[existingItemIndex].quantity += guestItem.quantity;
              } else {
                // Add new item to user cart
                userCartItems.push({ ...guestItem });
              }
            });
            
            // Save merged cart to user's cart
            localStorage.setItem(`cart_${userId}`, JSON.stringify(userCartItems));
            
            // Remove guest cart
            localStorage.removeItem('cart_guest');
            
            // Update current cart items and notify subscribers
            this.cartItems = userCartItems;
            this.cartUpdated.next();
            
            console.log('Guest cart merged with user cart successfully');
          }
        }
      } catch (error) {
        console.error('Error merging guest cart with user cart:', error);
      }
    }
  }
} 