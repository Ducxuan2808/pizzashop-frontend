import { Component, OnInit } from '@angular/core';
import { Pizza } from '../../model/pizza';
import { Size } from '../../model/size';
import { Type } from '../../model/type';
import { PizzaService } from '../../service/pizza.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environments';
import { SizeService } from '../../service/size.service';
import { TypeService } from '../../service/type.service';
import { CartService } from '../../service/cart.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  pizzas:Pizza[] = [];
  sizes: Size[] = [];
  types: Type[] = [];
  minPrice: number = 0;
  maxPrice: number = 10000000;
  sortBy='';
  currentPage: number = 0;
  itemsPerPage: number = 6;
  pages: number[] =[];
  totalPages:number = 0;
  visiblePages: number[] = [];
  keyword:string = "";
  
  // Popup related properties
  selectedPizza: Pizza | null = null;
  selectedSizeId: number = 0;
  selectedTypeId: number = 0;
  selectedPizzaPrice: number = 0;
  orderNote: string = '';
  popupVisible: boolean = false;
  quantity: number = 1;

  constructor(
    private pizzaService: PizzaService,
    private router: Router,
    private sizeService: SizeService,
    private typeService: TypeService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // First, load sizes
    this.sizeService.getSizes().subscribe({
      next: (sizes: Size[]) => {
        this.sizes = sizes;
        console.log('Sizes loaded:', this.sizes);
        
        // Then load types
        this.typeService.getTypes().subscribe({
          next: (types: Type[]) => {
            this.types = types;
            console.log('Types loaded:', this.types);
            
            // Once both are loaded, fetch pizzas
            this.getPizzas();
          },
          error: (error: any) => {
            console.error('Error fetching types', error);
            this.types = [];
          }
        });
      },
      error: (error: any) => {
        console.error('Error fetching sizes', error);
        this.sizes = [];
      }
    });
  }

  getPizzas() {
    this.pizzaService.bestSellPizzas().subscribe({
      next: (response:any) =>{
        response.pizzas.forEach((pizza: Pizza) => { 
          pizza.url = `${environment.apiBaseUrl}/pizzas/images/${pizza.thumbnail}`;
        });
        this.pizzas = response.pizzas.slice(0, 4); // Get only the first 4 pizzas
      },
      complete: ()=>{
        console.log('Completed fetching best selling pizzas');
      },
      error: (error: any)=>{
        console.error('Error fetching products', error);
      }
    });
  }
  
  getPriceByIds(pizzaId: number, sizeId: number, typeId: number): number {
    const pizza = this.pizzas.find(pizza => pizza.id === pizzaId);
    const size = this.sizes.find(size => size.id === sizeId);
    const type = this.types.find(type => type.id === typeId);

    if(pizza && size && type) {
      return pizza.base_price * size.price_multiplier + type.price;
    }
    return pizza?.base_price ?? 0;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

  openPopup(pizza: Pizza): void {
    console.log('Opening popup for pizza:', pizza);
    
    // Check if sizes and types are loaded
    if (!this.sizes || this.sizes.length === 0) {
      console.warn('No sizes available');
      return;
    }
    
    if (!this.types || this.types.length === 0) {
      console.warn('No types available');
      return;
    }
    
    this.selectedPizza = pizza;
    this.selectedSizeId = this.sizes[0].id;
    this.selectedTypeId = this.types[0].id;
    this.selectedPizzaPrice = this.getPriceByIds(pizza.id, this.selectedSizeId, this.selectedTypeId);
    this.orderNote = '';
    this.quantity = 1;
    this.popupVisible = true;
  }

  closePopup(): void {
    this.popupVisible = false;
    this.selectedPizza = null;
    this.selectedSizeId = 0;
    this.selectedTypeId = 0;
    this.selectedPizzaPrice = 0;
    this.orderNote = '';
    this.quantity = 1;
  }

  selectSize(sizeId: number): void {
    this.selectedSizeId = sizeId;
    if (this.selectedPizza) {
      this.selectedPizzaPrice = this.getPriceByIds(
        this.selectedPizza.id,
        this.selectedSizeId,
        this.selectedTypeId
      );
    }
  }

  selectType(typeId: number): void {
    this.selectedTypeId = typeId;
    if (this.selectedPizza) {
      this.selectedPizzaPrice = this.getPriceByIds(
        this.selectedPizza.id,
        this.selectedSizeId,
        this.selectedTypeId
      );
    }
  }

  updateOrderNote(event: any): void {
    this.orderNote = event.target.value;
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

  addToCart(): void {
    if (!this.selectedPizza) return;
    
    // Create cart item object
    const selectedSize = this.sizes.find(s => s.id === this.selectedSizeId);
    const selectedType = this.types.find(t => t.id === this.selectedTypeId);
    
    if (!selectedSize || !selectedType) return;
    
    const cartItem = {
      id: this.selectedPizza.id,
      name: this.selectedPizza.name,
      image: this.selectedPizza.url,
      size: selectedSize.size_name,
      type: selectedType.base_name,
      quantity: this.quantity,
      price: this.selectedPizzaPrice
    };
    
    // Add to cart using CartService
    this.cartService.addToCart(cartItem);
    
    this.closePopup();
    
    // Show a success message
    alert('Sản phẩm đã được thêm vào giỏ hàng!');
  }
  onPizzaClick(pizzaId: number) {
    this.router.navigate(['/pizzas', pizzaId]);
  }
}
