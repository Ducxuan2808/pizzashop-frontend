import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartService, CartItem as ServiceCartItem } from '../../service/cart.service';
import { PizzaService } from '../../service/pizza.service';
import { SizeService } from '../../service/size.service';
import { TypeService } from '../../service/type.service';
import { Pizza } from '../../model/pizza';
import { Size } from '../../model/size';
import { Type } from '../../model/type';
import { environment } from '../../environments/environments';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PizzaImage } from '../../model/pizza.image';
import { MessageService } from 'primeng/api';

// Extended CartItem for UI
interface ExtendedCartItem extends ServiceCartItem {
  pizza?: Pizza;
  size?: Size;
  type?: Type;
}

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  providers: [MessageService]
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: ExtendedCartItem[] = [];
  cartTotal: number = 0;
  cartItemCount: number = 0;
  shippingFee: number = 30000; // Phí vận chuyển
  subtotal: number = 0;
  total: number = 0;
  isCartLoading: boolean = true;
  sizes: Size[] = [];
  types: Type[] = [];
  private cartSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private cartService: CartService,
    private pizzaService: PizzaService,
    private sizeService: SizeService,
    private typeService: TypeService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    // Load sizes and types first, then load cart
    this.loadSizesAndTypes();
    
    // Subscribe to cart updates
    this.cartSubscription = this.cartService.cartUpdated.subscribe(() => {
      this.loadCart();
    });
    
    // Initial load
    this.loadCart();
  }
  
  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  private loadSizesAndTypes(): void {
    // Load sizes
    this.sizeService.getSizes().subscribe({
      next: (sizes: Size[]) => {
        this.sizes = sizes;
        
        // Load types
        this.typeService.getTypes().subscribe({
          next: (types: Type[]) => {
            this.types = types;
            
            // Now that we have sizes and types, load the cart
            this.loadCart();
          },
          error: (error) => {
            console.error('Error loading types:', error);
            this.loadCart(); // Still try to load cart even if types fail
          }
        });
      },
      error: (error) => {
        console.error('Error loading sizes:', error);
        this.loadCart(); // Still try to load cart even if sizes fail
      }
    });
  }

  private loadCart(): void {
    this.isCartLoading = true;
    
    // Get cart items from service
    const cartItems = this.cartService.getCartItems();
    
    if (cartItems.length === 0) {
      this.cartItems = [];
      this.subtotal = 0;
      this.total = 0;
      this.cartItemCount = 0;
      this.isCartLoading = false;
      return;
    }
    
    // Extract unique pizza IDs from cart items
    const pizzaIds = [...new Set(cartItems.map(item => item.pizzaId))];
    
    // If there are pizzas in the cart, fetch their details
    if (pizzaIds.length > 0) {
      this.pizzaService.getPizzasByIds(pizzaIds).subscribe({
        next: (pizzas: Pizza[]) => {
          // Process pizzas to ensure they have image URLs
          pizzas.forEach(pizza => {
            if (pizza.pizza_images && pizza.pizza_images.length > 0) {
              pizza.pizza_images.forEach((pizza_image: PizzaImage) => {
                pizza_image.image_url = `${environment.apiBaseUrl}/pizzas/images/${pizza_image.image_url}`;
              });
              pizza.url = pizza.pizza_images[pizza.pizza_images.length - 1].image_url;
            }
            // Set URL for main image if not already set
            if (!pizza.url) {
              pizza.url = `${environment.apiBaseUrl}/pizzas/images/${pizza.thumbnail}`;
            }
          });
          
          // Create maps for pizzas, sizes, and types for quick lookup
          const pizzaMap = new Map<number, Pizza>();
          pizzas.forEach(pizza => {
            pizzaMap.set(pizza.id, pizza);
          });
          
          const sizeMap = new Map<number, Size>();
          this.sizes.forEach(size => {
            sizeMap.set(size.id, size);
          });
          
          const typeMap = new Map<number, Type>();
          this.types.forEach(type => {
            typeMap.set(type.id, type);
          });
          
          // Enrich cart items with pizza details
          this.cartItems = cartItems.map(item => {
            const pizza = pizzaMap.get(item.pizzaId);
            const size = sizeMap.get(item.sizeId);
            const type = typeMap.get(item.typeId);
            
            return {
              ...item,
              pizza,
              size,
              type
            };
          });
          
          // Calculate totals
          this.calculateCartTotals();
          this.isCartLoading = false;
        },
        error: (error) => {
          console.error('Error fetching pizza details:', error);
          this.cartItems = cartItems.map(item => ({
            ...item,
            size: this.getSizeById(item.sizeId),
            type: this.getTypeById(item.typeId)
          }));
          this.calculateCartTotals();
          this.isCartLoading = false;
        }
      });
    } else {
      this.cartItems = [];
      this.subtotal = 0;
      this.total = 0; 
      this.cartItemCount = 0;
      this.isCartLoading = false;
    }
  }

  private getSizeById(sizeId: number): Size | undefined {
    return this.sizes.find(size => size.id === sizeId);
  }
  
  private getTypeById(typeId: number): Type | undefined {
    return this.types.find(type => type.id === typeId);
  }

  private calculateCartTotals(): void {
    this.subtotal = this.cartService.getTotalPrice();
    this.total = this.subtotal + this.shippingFee;
    this.cartItemCount = this.cartService.getTotalItems();
  }

  public updateCartItemQuantity(item: ExtendedCartItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity >= 1 && newQuantity <= 50) {
      this.cartService.updateItemQuantity(item.pizzaId, newQuantity);
    }
  }

  public setCartItemQuantity(item: ExtendedCartItem, event: any): void {
    let newQuantity = parseInt(event.target.value);
    
    // Validate quantity
    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
    } else if (newQuantity > 50) {
      newQuantity = 50;
    }
    
    // Update the cart
    this.cartService.updateItemQuantity(item.pizzaId, newQuantity);
  }

  public removeCartItem(item: ExtendedCartItem): void {
    this.cartService.removeItem(item.pizzaId);
  }

  public clearCart(): void {
    this.cartService.clearCart();
  }

  public proceedToCheckout(): void {
    // Check user role first
    const userJSON = localStorage.getItem('user');
    if (!userJSON) {
      // User not logged in, redirect to login
      this.router.navigate(['/login']);
      return;
    }

    try {
      const user = JSON.parse(userJSON);
      // Get role_name from nested role_id object
      const userRole = user.role_id?.role_name;

      // Check if user is staff or admin
      if (userRole === 'staff' || userRole === 'admin') {
        // Show error message for staff/admin accounts
        this.messageService.add({
          severity: 'error',
          summary: 'Không thể thanh toán',
          detail: 'Tài khoản này không được dùng để thanh toán. Vui lòng sử dụng tài khoản khách hàng.',
          life: 5000
        });
        return;
      }

      // User role is valid (user), proceed with checkout
      this.cartService.prepareCheckoutData();
      this.router.navigate(['/order']);
      
    } catch (error) {
      console.error('Error parsing user data:', error);
      // If can't parse user data, redirect to login
      this.router.navigate(['/login']);
    }
  }

  public continueShopping(): void {
    this.router.navigate(['/pizzas']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(price)
      .replace(/\s+/g, '');
  }
  
  // Handle image loading errors by setting a placeholder
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'assets/image/placeholder-pizza.jpg';
    }
  }
}
