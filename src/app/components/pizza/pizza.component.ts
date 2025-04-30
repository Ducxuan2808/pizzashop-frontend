import { Component, OnInit, OnDestroy } from '@angular/core';
import { Pizza } from '../../model/pizza';
import { PizzaService } from '../../service/pizza.service';
import { Size } from '../../model/size';
import { Type } from '../../model/type';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environments';
import { SizeService } from '../../service/size.service';
import { TypeService } from '../../service/type.service';
import { HttpClient } from '@angular/common/http';
import { SearchService } from '../../service/search.service';
import { Subscription } from 'rxjs';
import { CartService } from '../../service/cart.service';

@Component({
  selector: 'app-pizza',
  standalone: false,
  templateUrl: './pizza.component.html',
  styleUrl: './pizza.component.scss'
})
export class PizzaComponent implements OnInit, OnDestroy {
  pizzas: Pizza[] = [];
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
  private searchSubscription: Subscription;
  
  // Popup related properties
  selectedPizza: Pizza | null = null;
  selectedSizeId: number = 0;
  selectedTypeId: number = 0;
  selectedPizzaPrice: number = 0;
  orderNote: string = '';
  popupVisible: boolean = false;
  quantity: number = 1;
  loading: boolean = true;
  error: any = null;
  selectedCategory: string = '';
  priceRange: string = '';
  sizeFilter: string = '';
  baseFilter: string = '';
  categories: string[] = ['Tất cả', 'Pizza', 'Pasta', 'Salad', 'Nước uống'];
  priceRanges = [
    { label: 'Dưới 100.000đ', value: '0-100000' },
    { label: 'Từ 100.000đ - 200.000đ', value: '100000-200000' },
    { label: 'Từ 200.000đ - 300.000đ', value: '200000-300000' },
    { label: 'Từ 300.000đ - 500.000đ', value: '300000-500000' },
    { label: 'Từ 500.000đ - 1 triệu', value: '500000-1000000' },
    { label: 'Trên 1 triệu', value: '1000000-10000000' }
  ];
  isSearchActive: boolean = false;

  constructor(
    private pizzaService: PizzaService,
    private sizeService: SizeService,
    private typeService: TypeService,
    private router: Router,
    private http: HttpClient,
    private searchService: SearchService,
    private route: ActivatedRoute,
    private cartService: CartService
  ) {
    this.searchSubscription = this.searchService.currentKeyword.subscribe(keyword => {
      this.keyword = keyword;
      this.searchPizzas();
    });
  }

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
            this.getPizzas(this.sortBy, this.minPrice, this.maxPrice, this.keyword, this.currentPage, this.itemsPerPage);
            // Remove this if it's redundant with getPizzas
            // this.fetchPizzas(); 
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
    this.fetchPizzas();

    // Listen to route query params for search
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.keyword = params['search'];
        this.searchPizzas();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  toggleSearch(): void {
    this.isSearchActive = !this.isSearchActive;
    if (this.isSearchActive) {
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 300);
    }
  }

  searchPizzas(): void {
    // Reset to first page when searching
    this.currentPage = 0;
    this.getPizzas(this.sortBy, this.minPrice, this.maxPrice, this.keyword, this.currentPage, this.itemsPerPage);
  }

  //sortBy can be : 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest'
  getPizzas(sortBy: string, minPrice: number, maxPrice: number, keyword: string, currentPage: number, itemsPerPage: number) {
    this.pizzaService.getPizzas(sortBy, minPrice, maxPrice, keyword, currentPage, itemsPerPage).subscribe({
      next: (response:any) =>{
        response.pizzas.forEach((pizza: Pizza) => { 
          pizza.url = `${environment.apiBaseUrl}/pizzas/images/${pizza.thumbnail}`;
        });
        this.pizzas = response.pizzas;
        this.totalPages = response.totalPages;
        this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
      },
      complete: ()=>{
        console.log('Completed fetching pizzas');
      },
      error: (error: any)=>{
        console.error('Error fetching products', error);
      }
    });
  }

  onPageChange(page: number){
    this.currentPage = page;
    this.getPizzas(this.sortBy, this.minPrice, this.maxPrice, this.keyword, this.currentPage, this.itemsPerPage);
  }

  generateVisiblePageArray(currentPage:number, totalPages:number):number[] {
    const maxVisiablePages = 5;
    const halfVisiablePages = Math.floor(maxVisiablePages /2);

    let startPage = Math.max(currentPage - halfVisiablePages, 1);
    let endPage = Math.min(currentPage + halfVisiablePages- 1, totalPages);

    if(endPage- startPage +1 < maxVisiablePages){
      startPage = Math.max(endPage-maxVisiablePages+1,1 );
    }
    return new Array(endPage-startPage +1).fill(0).map((_,index) => startPage+ index);
  }

  onProductClick(pizzzaId: number){
    this.router.navigate(['/pizzas', pizzzaId]);
  }

  getSizes() {
    this.sizeService.getSizes().subscribe({
      next: (sizes: Size[]) => {
        this.sizes = sizes || [];
        console.log('Sizes loaded:', this.sizes);
      },
      complete: () => {
        console.log('Completed fetching sizes');
      },
      error: (error: any) => {
        console.error('Error fetching sizes', error);
        this.sizes = [];
      }
    });
  }
  
  getTypes() {
    this.typeService.getTypes().subscribe({
      next: (types: Type[]) => {
        this.types = types || [];
        console.log('Types loaded:', this.types);
      },
      complete: () => {
        console.log('Completed fetching types');
      },
      error: (error: any) => {
        console.error('Error fetching types', error);
        this.types = [];
      }
    });
  }

  getPriceByIds(pizzaId:number, sizeId:number, typeId:number):number{
    const pizza = this.pizzas.find(pizza => pizza.id === pizzaId);
    const size = this.sizes.find(size => size.id === sizeId);
    const type = this.types.find(type => type.id === typeId);

    if(pizza && size && type){
      return pizza.base_price * size.price_multiplier + type.price;
    }
    return pizza?.base_price ?? 0;
  }
  
  updateSelectedPizzaPrice() {
    if (this.selectedPizza) {
      this.selectedPizzaPrice = this.getPriceByIds(
        this.selectedPizza.id,
        this.selectedSizeId,
        this.selectedTypeId
      );
    }
  }

  fetchPizzas() {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiBaseUrl}/pizzas`).subscribe({
      next: (data) => {
        this.pizzas = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err;
        this.loading = false;
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

  openPopup(pizza: Pizza): void {
    console.log('Opening popup for pizza:', pizza);
    
    // Check if sizes and types are loaded
    if (!this.sizes || this.sizes.length === 0) {
      console.warn('No sizes available');
      this.getSizes(); // Try to load sizes if they're not available
      return;
    }
    
    if (!this.types || this.types.length === 0) {
      console.warn('No types available');
      this.getTypes(); // Try to load types if they're not available
      return;
    }
    
    // Set the selected pizza and default to the first size and type
    this.selectedPizza = pizza;
    this.selectedSizeId = this.sizes[0].id;
    this.selectedTypeId = this.types[0].id;
    
    // Calculate the price based on the selected options
    this.selectedPizzaPrice = this.getPriceByIds(
      pizza.id, 
      this.selectedSizeId, 
      this.selectedTypeId
    );
    
    // Reset other options
    this.orderNote = '';
    this.quantity = 1;
    this.popupVisible = true;
  }

  closePopup(): void {
    console.log('Closing popup');
    this.popupVisible = false;
    this.selectedPizza = null;
    this.selectedSizeId = 0;
    this.selectedTypeId = 0;
    this.selectedPizzaPrice = 0;
    this.orderNote = '';
    this.quantity = 1;
  }

  selectSize(sizeId: number): void {
    console.log('Selecting size:', sizeId);
    this.selectedSizeId = sizeId;
    if (this.selectedPizza) {
      this.selectedPizzaPrice = this.getPriceByIds(
        this.selectedPizza.id,
        this.selectedSizeId,
        this.selectedTypeId
      );
      console.log('Updated price:', this.selectedPizzaPrice);
    }
  }

  selectType(typeId: number): void {
    console.log('Selecting type:', typeId);
    this.selectedTypeId = typeId;
    if (this.selectedPizza) {
      this.selectedPizzaPrice = this.getPriceByIds(
        this.selectedPizza.id,
        this.selectedSizeId,
        this.selectedTypeId
      );
      console.log('Updated price:', this.selectedPizzaPrice);
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
    
    const totalPrice = this.selectedPizzaPrice * this.quantity;
    
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
      price: totalPrice
    };
    
    // Add to cart using CartService
    this.cartService.addToCart(cartItem);
    
    alert('Sản phẩm đã được thêm vào giỏ hàng!');
    this.closePopup();
  }

  applyFilters(): void {
    this.fetchPizzas();
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.priceRange = '';
    this.sizeFilter = '';
    this.baseFilter = '';
    this.keyword = '';
    this.fetchPizzas();
  }
  onPizzaClick(pizzaId: number){
    // Navigate to the pizza detail page
    this.router.navigate(['/pizzas', pizzaId]);
  }
}
