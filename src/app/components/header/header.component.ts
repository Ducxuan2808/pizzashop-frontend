import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService } from '../../service/search.service';
import { CartService, CartItem as ServiceCartItem } from '../../service/cart.service';
import { PizzaService } from '../../service/pizza.service';
import { Pizza } from '../../model/pizza';
import { Size } from '../../model/size';
import { Type } from '../../model/type';
import { SizeService } from '../../service/size.service';
import { TypeService } from '../../service/type.service';
import { environment } from '../../environments/environments';
import { Subscription } from 'rxjs';
import { PizzaImage } from '../../model/pizza.image';
import { UserService } from '../../service/user.service';
import { UserResponse } from '../../responses/user/user.response';
import { TokenService } from '../../service/token.service';

// Extended CartItem for UI
interface ExtendedCartItem extends ServiceCartItem {
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
  cartItems: ExtendedCartItem[] = [];
  cartTotal: number = 0;
  cartItemCount: number = 0;
  sizes: Size[] = [];
  types: Type[] = [];
  isCartLoading: boolean = true;
  private cartSubscription: Subscription | null = null;
  isUserLoggedIn: boolean = false;
  currentUser: UserResponse | null = null;
  private userId: string | null = null;

  constructor(
    private router: Router,
    private searchService: SearchService,
    private cartService: CartService,
    private pizzaService: PizzaService,
    private sizeService: SizeService,
    private typeService: TypeService,
    private userService: UserService,
    private tokenService: TokenService
  ) {}

  setActiveNavItem(index: number) {
    this.activeNavItem = index;
  }

  ngOnInit(): void {
    // Check if user is logged in
    this.checkUserLoginStatus();
    
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

  private checkUserLoginStatus(): void {
    const userData = this.userService.getUserResponseFromLocalStorage();
    const wasLoggedIn = this.isUserLoggedIn;
    const previousUserId = this.userId;
    
    this.isUserLoggedIn = !!userData;
    this.currentUser = userData;
    
    // Get user ID for cart data
    if (userData && userData.id) {
      this.userId = userData.id.toString();
    } else {
      this.userId = null;
    }
    
    // If login status or user ID changed, refresh the cart
    if (wasLoggedIn !== this.isUserLoggedIn || previousUserId !== this.userId) {
      this.cartService.refreshCart();
      this.loadCart();
    }
  }

  logout(): void {
    // Save current user ID before logout
    const previousUserId = this.userId;
    
    // Remove token
    this.tokenService.removeToken();
    // Remove user data
    this.userService.removeUserFromLocalStorage();
    // Update login status
    this.isUserLoggedIn = false;
    this.currentUser = null;
    this.userId = null;
    
    // Refresh cart to switch to guest cart
    this.cartService.refreshCart();
    this.loadCart();
    
    // Navigate to login page
    this.router.navigate(['/login']);
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
    
    // Get cart items from service - the service will handle getting the correct user's cart
    const cartItems = this.cartService.getCartItems();
    
    if (cartItems.length === 0) {
      this.cartItems = [];
      this.cartTotal = 0;
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

  public updateCartItemQuantity(item: ExtendedCartItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity >= 1 && newQuantity <= 50) {
      this.cartService.updateItemQuantity(item.pizzaId, newQuantity);
    }
  }

  public removeCartItem(item: ExtendedCartItem): void {
    this.cartService.removeItem(item.pizzaId);
  }

  public clearCart(): void {
    this.cartService.clearCart();
  }

  navigateToCart(): void {
    this.router.navigate(['/cart']);
  }

  onSearch(): void {
    if (this.searchKeyword.trim()) {
      console.log('Searching for:', this.searchKeyword.trim());
      // Update the search keyword in the search service
      this.searchService.updateSearchKeyword(this.searchKeyword.trim());
      
      // Navigate to the pizzas page with the search query parameter
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

  // Handle image loading errors by setting a placeholder
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'assets/image/placeholder-pizza.jpg';
    }
  }
}
