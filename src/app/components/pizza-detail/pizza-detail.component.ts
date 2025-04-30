import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Pizza } from '../../model/pizza';
import { Size } from '../../model/size';
import { Type } from '../../model/type';
import { CartService } from '../../service/cart.service';
import { PizzaService } from '../../service/pizza.service';
import { SizeService } from '../../service/size.service';
import { TypeService } from '../../service/type.service';
import { environment } from '../../environments/environments';
import { PizzaImage } from '../../model/pizza.image';

@Component({
  selector: 'app-pizza-detail',
  standalone: false,
  templateUrl: './pizza-detail.component.html',
  styleUrl: './pizza-detail.component.scss'
})
export class PizzaDetailComponent implements OnInit {
  pizzaId!: number;
  pizza!: Pizza;
  isLoading: boolean = true;
  error: string = '';
  
  selectedSize!: Size;
  selectedType!: Type;
  quantity: number = 1;
  orderNote: string = '';

  sizes: Size[] = [];
  types: Type[] = [];
  
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private pizzaService: PizzaService,
    private cartService: CartService,
    private sizeService: SizeService,
    private typeService: TypeService
  ) { }

  ngOnInit(): void {
    // Get the pizza ID from the route parameters
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if(idParam !== null) {
      this.pizzaId = +idParam;
    }

    // First load sizes and types
    this.loadSizesAndTypes(() => {
      // After sizes and types are loaded, get the pizza details
      this.getPizza();
    });
  }

  loadSizesAndTypes(callback: () => void): void {
    // Load sizes
    this.sizeService.getSizes().subscribe({
      next: (sizes: Size[]) => {
        this.sizes = sizes;
        console.log('Sizes loaded:', this.sizes);
        
        // Load types
        this.typeService.getTypes().subscribe({
          next: (types: Type[]) => {
            this.types = types;
            console.log('Types loaded:', this.types);
            
            // Both sizes and types loaded, call the callback
            callback();
          },
          error: (error: any) => {
            console.error('Error fetching types', error);
            this.types = [];
            callback(); // Still call callback to proceed
          }
        });
      },
      error: (error: any) => {
        console.error('Error fetching sizes', error);
        this.sizes = [];
        callback(); // Still call callback to proceed
      }
    });
  }

  getPizza(): void {
    if(!isNaN(this.pizzaId)) {
      this.isLoading = true;
      this.error = '';
      
      this.pizzaService.getDetailPizza(this.pizzaId).subscribe({
        next: (response: any) => {
          // Process images if needed
          if(response.pizza_images && response.pizza_images.length > 0) {
            response.pizza_images.forEach((pizza_image: PizzaImage) => {
              pizza_image.image_url = `${environment.apiBaseUrl}/pizzas/images/${pizza_image.image_url}`;
            });
          }
          // Set URL for main image if not already set
          if (!response.url) {
            response.url = `${environment.apiBaseUrl}/pizzas/images/${response.thumbnail}`;
          }
          
          this.pizza = response;
          
          // Set default selections from the first available size and type
          this.setDefaultSelections();
          
          this.isLoading = false;
        },
        complete: () => {
          console.log('Pizza detail fetch complete');
        },
        error: (error: any) => {
          this.error = 'Failed to load pizza details. Please try again.';
          this.isLoading = false;
          console.error('Error fetching pizza detail:', error);
        }
      });
    } else {
      console.error('Invalid pizzaId:', this.pizzaId);
      this.error = 'Invalid pizza ID provided.';
    }
  }

  setDefaultSelections(): void {
    // Set default size - first from pizza.sizes or from global sizes
    if (this.pizza && this.pizza.sizes && this.pizza.sizes.length > 0) {
      this.selectedSize = this.pizza.sizes[0];
    } else if (this.sizes.length > 0) {
      this.selectedSize = this.sizes[0];
    }
    
    // Set default type - first from pizza.crusts or from global types
    if (this.pizza && this.pizza.crusts && this.pizza.crusts.length > 0) {
      this.selectedType = this.pizza.crusts[0];
    } else if (this.types.length > 0) {
      this.selectedType = this.types[0];
    }
  }

  selectSize(size: Size): void {
    this.selectedSize = size;
    // Recalculate price when size changes
    this.calculateTotalPrice();
  }

  selectType(type: Type): void {
    this.selectedType = type;
    // Recalculate price when type changes
    this.calculateTotalPrice();
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  increaseQuantity(): void {
    if (this.quantity < 50) {
      this.quantity++;
    }
  }

  updateOrderNote(event: any): void {
    this.orderNote = event.target.value;
  }

  calculateTotalPrice(): number {
    if (!this.pizza || !this.selectedSize || !this.selectedType) {
      return 0;
    }
    
    return (this.pizza.base_price * this.selectedSize.price_multiplier + this.selectedType.price) * this.quantity;
  }

  addToCart(): void {
    if (!this.pizza || !this.selectedSize || !this.selectedType) {
      return;
    }
    
    const totalPrice = this.calculateTotalPrice();
    
    const cartItem = {
      id: this.pizzaId,
      name: this.pizza.name,
      image: this.pizza.url,
      size: this.selectedSize.size_name,
      type: this.selectedType.base_name,
      quantity: this.quantity,
      price: totalPrice
    };
    
    this.cartService.addToCart(cartItem);
    
    alert('Pizza added to cart successfully!');
  }

  goBack(): void {
    this.router.navigate(['/pizzas']);
  }
}
