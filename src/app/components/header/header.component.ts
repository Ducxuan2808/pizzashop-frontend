import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService } from '../../services/search.service';
import { CartService } from '../../service/cart.service';
import { PizzaService } from '../../service/pizza.service';
import { Pizza } from '../../model/pizza';
import { Size } from '../../model/size';
import { Type } from '../../model/type';
import { SizeService } from '../../service/size.service';
import { TypeService } from '../../service/type.service';
import { environment } from '../../environments/environments';

interface CartItem {
  key: string;
  pizzaId: number;
  sizeId: number;
  typeId: number;
  quantity: number;
  price: number;
  pizza?: Pizza;
  size?: Size;
  type?: Type;
}

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit{
  activeNavItem = 0;
  navItems = [
    { label: 'Trang chủ', link: '/' },
    { label: 'Giới thiệu', link: '/gioithieu' },
    { label: 'Sản phẩm', link: '/pizzas' },
    { label: 'Tin tức', link: '/tintuc' },
    { label: 'Câu hỏi thường gặp', link: '/question' },
    { label: 'Liên hệ', link: '/lienhe' },
    { label: 'Đặt bàn', link: '/tablebooking' },
  ];
  searchKeyword: string = '';
  cartItems: CartItem[] = [];
  cartTotal: number = 0;
  cartItemCount: number = 0;
  sizes: Size[] = [];
  types: Type[] = [];
  isCartLoading: boolean = true;

  constructor(
    private router: Router,
    private searchService: SearchService,
    private cartService: CartService,
    private pizzaService: PizzaService,
    private sizeService: SizeService,
    private typeService: TypeService
  ) {}

  setActiveNavItem(index: number) {
    this.activeNavItem = index;
  }

  ngOnInit(): void {
    // Load sizes and types first, then load cart
    this.loadSizesAndTypes();
    
    // Refresh cart whenever the component initializes
    this.loadCart();
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
    this.cartService.refreshCart(); // Ensure we have the latest cart data
    
    const cart = this.cartService.getCart();
    if (cart.size === 0) {
      this.cartItems = [];
      this.cartTotal = 0;
      this.cartItemCount = 0;
      this.isCartLoading = false;
      return;
    }
    
    // Extract pizza IDs from cart
    const pizzaIds: number[] = Array.from(cart.values()).map(item => item.pizzaId);
    const uniquePizzaIds = [...new Set(pizzaIds)]; // Remove duplicates
    
    // If there are pizzas in the cart, fetch their details
    if (uniquePizzaIds.length > 0) {
      this.pizzaService.getPizzasByIds(uniquePizzaIds).subscribe({
        next: (pizzas: Pizza[]) => {
          // Process pizzas to ensure they have image URLs
          pizzas.forEach(pizza => {
            // Set the pizza image URL if it doesn't exist
            if (!pizza.url) {
              pizza.url = `${this.getApiBaseUrl()}/pizzas/images/${pizza.thumbnail}`;
            }
            
            // Ensure pizza_images have URLs if they exist
            if (pizza.pizza_images && pizza.pizza_images.length > 0) {
              pizza.pizza_images.forEach(image => {
                if (!image.image_url.startsWith('http')) {
                  image.image_url = `${this.getApiBaseUrl()}/pizzas/images/${image.image_url}`;
                }
              });
            }
          });
          
          // Create a map of pizzas for quick lookup
          const pizzaMap = new Map<number, Pizza>();
          pizzas.forEach(pizza => {
            pizzaMap.set(pizza.id, pizza);
          });
          
          // Convert the cart Map to an array of CartItems with pizza details
          this.cartItems = Array.from(cart.entries()).map(([key, item]) => {
            const pizza = pizzaMap.get(item.pizzaId);
            const size = this.getSizeById(item.sizeId);
            const type = this.getTypeById(item.typeId);
            
            return {
              key,
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
          this.isCartLoading = false;
        }
      });
    } else {
      this.cartItems = [];
      this.cartTotal = 0;
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
    this.cartTotal = this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    this.cartItemCount = this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  public updateCartItemQuantity(item: CartItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity >= 1 && newQuantity <= 50) {
      // Update the quantity in our local cart items array
      item.quantity = newQuantity;
      
      // Update the cart Map and save to localStorage
      const cart = this.cartService.getCart();
      if (cart.has(item.key)) {
        const cartItem = cart.get(item.key)!;
        cartItem.quantity = newQuantity;
        this.cartService.setCart(cart);
      }
      
      // Recalculate totals
      this.calculateCartTotals();
    }
  }

  public removeCartItem(item: CartItem): void {
    // Remove from our local cart items array
    this.cartItems = this.cartItems.filter(i => i.key !== item.key);
    
    // Remove from the cart Map and save to localStorage
    const cart = this.cartService.getCart();
    if (cart.has(item.key)) {
      cart.delete(item.key);
      this.cartService.setCart(cart);
    }
    
    // Recalculate totals
    this.calculateCartTotals();
  }

  public clearCart(): void {
    this.cartService.clearCart();
    this.cartItems = [];
    this.cartTotal = 0;
    this.cartItemCount = 0;
  }

  onSearch(): void {
    if (this.searchKeyword.trim()) {
      this.searchService.updateSearchKeyword(this.searchKeyword.trim());
      this.router.navigate(['/pizzas'], { 
        queryParams: { search: this.searchKeyword.trim() }
      });
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(price)
      .replace(/\s+/g, '');
  }

  // Helper method to get the API base URL
  private getApiBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  // Handle image loading errors by setting a placeholder
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'assets/image/placeholder-pizza.jpg';
    }
  }
}
