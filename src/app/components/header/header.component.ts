import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService } from '../../service/search.service';
import { CartService } from '../../service/cart.service';
import { PizzaService } from '../../service/pizza.service';
import { Pizza } from '../../model/pizza';
import { Size } from '../../model/size';
import { Type } from '../../model/type';
import { SizeService } from '../../service/size.service';
import { TypeService } from '../../service/type.service';
import { environment } from '../../environments/environments';
import { Subscription } from 'rxjs';

interface CartItem {
  id: number;
  name: string;
  image?: string;
  size: string;
  type: string;
  quantity: number;
  price: number;
  pizza?: Pizza;
}

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
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
  private cartSubscription: Subscription | null = null;

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
      this.cartTotal = 0;
      this.cartItemCount = 0;
      this.isCartLoading = false;
      return;
    }
    
    // Extract unique pizza IDs from cart items
    const pizzaIds = [...new Set(cartItems.map(item => item.id))];
    
    // If there are pizzas in the cart, fetch their details
    if (pizzaIds.length > 0) {
      this.pizzaService.getPizzasByIds(pizzaIds).subscribe({
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
          
          // Enrich cart items with pizza details
          this.cartItems = cartItems.map(item => {
            const pizza = pizzaMap.get(item.id);
            return {
              ...item,
              pizza
            };
          });
          
          // Calculate totals
          this.calculateCartTotals();
          this.isCartLoading = false;
        },
        error: (error) => {
          console.error('Error fetching pizza details:', error);
          this.cartItems = cartItems;
          this.calculateCartTotals();
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
    this.cartTotal = this.cartService.getTotalPrice();
    this.cartItemCount = this.cartService.getTotalItems();
  }

  public updateCartItemQuantity(item: CartItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity >= 1 && newQuantity <= 50) {
      this.cartService.updateItemQuantity(item.id, newQuantity);
    }
  }

  public removeCartItem(item: CartItem): void {
    this.cartService.removeItem(item.id);
  }

  public clearCart(): void {
    this.cartService.clearCart();
  }

  navigateToCart(): void {
    this.router.navigate(['/cart']);
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
