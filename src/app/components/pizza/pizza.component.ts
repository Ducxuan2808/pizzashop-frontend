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
import { PizzaImage } from '../../model/pizza.image';
import { ReviewService } from '../../service/review.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-pizza',
  standalone: false,
  templateUrl: './pizza.component.html',
  styleUrl: './pizza.component.scss',
  providers: [MessageService]
})
export class PizzaComponent implements OnInit, OnDestroy {
  pizzas: Pizza[] = [];
  allPizzas: Pizza[] = []; // To store all pizzas for client-side filtering
  filteredPizzas: Pizza[] = []; // To store filtered pizzas
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
  pizzaRatings: { [key: number]: number } = {}; // Store average ratings for each pizza

  // Add these properties for the review modal
  reviewModalVisible = false;
  selectedPizzaForReview: Pizza | null = null;
  currentReviews: any[] = [];
  isLoadingReviews = false;
  reviewError = '';

  // Add property for sales counts
  pizzaSalesCounts: { [key: number]: number } = {};

  constructor(
    private pizzaService: PizzaService,
    private sizeService: SizeService,
    private typeService: TypeService,
    private router: Router,
    private http: HttpClient,
    private searchService: SearchService,
    private route: ActivatedRoute,
    private cartService: CartService,
    private reviewService: ReviewService,
    private messageService: MessageService
  ) {
    this.searchSubscription = this.searchService.currentKeyword.subscribe(keyword => {
      console.log('Search keyword received in PizzaComponent:', keyword);
      this.keyword = keyword;
      // Call the search method when keyword changes
      if (this.allPizzas.length > 0) {
        this.applyFiltersAndSearch();
      } else {
        // If pizzas aren't loaded yet, we'll load them with the search term
        this.fetchAllPizzas();
      }
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
            
            // Once both are loaded, fetch all pizzas
            this.fetchAllPizzas();
          },
          error: (error: any) => {
            console.error('Error fetching types', error);
            this.types = [];
            this.fetchAllPizzas(); // Still try to fetch pizzas even if types fail
          }
        });
      },
      error: (error: any) => {
        console.error('Error fetching sizes', error);
        this.sizes = [];
        this.fetchAllPizzas(); // Still try to fetch pizzas even if sizes fail
      }
    });

    // Listen to route query params for search
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        console.log('Search param from URL:', params['search']);
        this.keyword = params['search'];
        // Update the SearchService so other components know about the search
        this.searchService.updateSearchKeyword(this.keyword);
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

  // Fetch all pizzas at once for client-side filtering
  fetchAllPizzas(): void {
    this.loading = true;
    console.log('Fetching all pizzas...');
    
    // Use a high limit to get all pizzas
    this.pizzaService.getPizzas(this.sortBy, 0, Number.MAX_SAFE_INTEGER, '', 0, 1000).subscribe({
      next: (response: any) => {
        console.log('All pizzas response:', response);
        
        let allPizzasData: Pizza[] = [];
        if (response.pizzas) {
          allPizzasData = response.pizzas;
        } else if (Array.isArray(response)) {
          allPizzasData = response;
        }
        
        // Process pizzas to ensure they have image URLs
        allPizzasData.forEach((pizza: Pizza) => {
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
          
          // Get reviews and calculate rating
          this.reviewService.getReviewByPizzaId([pizza.id]).subscribe({
            next: (reviews: any[]) => {
              this.pizzaRatings[pizza.id] = this.calculateAverageRating(reviews);
            },
            error: (error) => {
              console.error(`Error fetching reviews for pizza ${pizza.id}:`, error);
              this.pizzaRatings[pizza.id] = 5;
            }
          });

          // Get sales count for this pizza
          this.pizzaService.getCountSoldByPizzaId(pizza.id).subscribe({
            next: (count: number) => {
              this.pizzaSalesCounts[pizza.id] = count;
            },
            error: (error) => {
              console.error(`Error fetching sales count for pizza ${pizza.id}:`, error);
              this.pizzaSalesCounts[pizza.id] = 0;
            }
          });
        });
        
        this.allPizzas = allPizzasData;
        this.applyFiltersAndSearch();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error fetching pizzas:', error);
        this.error = error;
        this.loading = false;
      }
    });
  }

  searchPizzas(): void {
    // Reset to first page when searching
    this.currentPage = 0;
    this.applyFiltersAndSearch();
  }

  // Apply all filters and search criteria to the all pizzas list
  applyFiltersAndSearch(): void {
    console.log('Applying filters and search with keyword:', this.keyword);
    
    if (this.allPizzas.length === 0) {
      console.log('No pizzas to filter');
      this.filteredPizzas = [];
      this.pizzas = [];
      this.totalPages = 0;
      this.visiblePages = [];
      return;
    }
    
    // Start with all pizzas
    let filtered = [...this.allPizzas];
    
    // Filter by search keyword
    if (this.keyword && this.keyword.trim() !== '') {
      const searchTerm = this.keyword.toLowerCase().trim();
      filtered = filtered.filter(pizza => 
        pizza.name.toLowerCase().includes(searchTerm) ||
        (pizza.description && pizza.description.toLowerCase().includes(searchTerm))
      );
      console.log(`After keyword filter: ${filtered.length} pizzas remaining`);
    }
    
    // Filter by category if selected
    if (this.selectedCategory && this.selectedCategory !== 'Tất cả') {
      filtered = filtered.filter(pizza => 
        (pizza as any).category === this.selectedCategory || 
        (pizza.name && pizza.name.includes(this.selectedCategory))
      );
      console.log(`After category filter: ${filtered.length} pizzas remaining`);
    }
    
    // Filter by price range if selected
    if (this.priceRange) {
      const [min, max] = this.priceRange.split('-').map(Number);
      this.minPrice = min;
      this.maxPrice = max;
      filtered = filtered.filter(pizza => 
        pizza.base_price >= min && pizza.base_price <= max
      );
      console.log(`After price range filter (${min}-${max}): ${filtered.length} pizzas remaining`);
    }
    
    // Apply sorting if needed
    if (this.sortBy) {
      switch (this.sortBy) {
        case 'price_asc':
          filtered.sort((a, b) => a.base_price - b.base_price);
          break;
        case 'price_desc':
          filtered.sort((a, b) => b.base_price - a.base_price);
          break;
        case 'name_asc':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name_desc':
          filtered.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'newest':
          filtered.sort((a, b) => b.id - a.id);
          break;
      }
      console.log(`After sorting: ${filtered.length} pizzas remaining`);
    }
    
    // Store the total filtered items for pagination
    const totalItems = filtered.length;
    this.totalPages = Math.ceil(totalItems / this.itemsPerPage);
    
    // Apply pagination
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, totalItems);
    
    // Get the current page items
    this.filteredPizzas = filtered.slice(startIndex, endIndex);
    
    // Update the display list
    this.pizzas = this.filteredPizzas;
    
    // Update visible pages
    this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
    
    console.log(`Final filtered list: ${this.pizzas.length} pizzas`);
  }

  //sortBy can be : 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest'
  getPizzas(sortBy: string, minPrice: number, maxPrice: number, keyword: string, currentPage: number, itemsPerPage: number) {
    this.pizzaService.getPizzas(sortBy, minPrice, maxPrice, keyword, currentPage, itemsPerPage).subscribe({
      next: (response:any) =>{
        response.pizzas.forEach((pizza: Pizza) => { 
          if(pizza.pizza_images && pizza.pizza_images.length > 0) {
            pizza.pizza_images.forEach((pizza_image: PizzaImage) => {
              pizza_image.image_url = `${environment.apiBaseUrl}/pizzas/images/${pizza_image.image_url}`;
            });
            pizza.url = pizza.pizza_images[pizza.pizza_images.length - 1 ].image_url;
          }
          // Set URL for main image if not already set
          if (!pizza.url) {
            pizza.url = `${environment.apiBaseUrl}/pizzas/images/${pizza.thumbnail}`;
          }
        });
        this.pizzas = response.pizzas;
        this.totalPages = response.totalPages;
        this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
        debugger
        // For each pizza, fetch its reviews and calculate average rating
        this.pizzas.forEach(pizza => {
          this.reviewService.getReviewByPizzaId([pizza.id]).subscribe({
            next: (reviews: any[]) => {
              debugger
              // Calculate average rating for this pizza
              this.pizzaRatings[pizza.id] = this.calculateAverageRating(reviews);
            },
            error: (error) => {
              debugger
              console.error(`Error fetching reviews for pizza ${pizza.id}:`, error);
              // Set default rating of 5 if there's an error
              this.pizzaRatings[pizza.id] = 5;
            }
          });
        });
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
    // Instead of making a new API call, use client-side pagination
    this.applyFiltersAndSearch();
  }

  generateVisiblePageArray(currentPage: number, totalPages: number): number[] {
    const maxVisiblePages = 5;
    const halfVisiblePages = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(currentPage - halfVisiblePages, 0);
    let endPage = Math.min(currentPage + halfVisiblePages, totalPages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 0);
    }
    
    // Generate array of page indexes (0-based)
    const pages: number[] = [];
    for (let i = 0; i <= endPage - startPage; i++) {
      pages.push(startPage + i);
    }
    return pages;
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
    if (this.allPizzas.length > 0) {
      // If we already have the pizzas, just apply filters
      this.applyFiltersAndSearch();
    } else {
      // Otherwise fetch all pizzas
      this.fetchAllPizzas();
    }
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
      pizzaId: this.selectedPizza.id,
      sizeId: this.selectedSizeId,
      typeId: this.selectedTypeId,
      quantity: this.quantity,
      price: totalPrice
    };
    
    // Add to cart using CartService
    this.cartService.addToCart(cartItem);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã thêm sản phẩm vào giỏ hàng'
    });
    this.closePopup();
  }

  applyFilters(): void {
    this.currentPage = 0; // Reset to first page when filters change
    this.applyFiltersAndSearch();
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.priceRange = '';
    this.minPrice = 0;
    this.maxPrice = 10000000;
    this.sizeFilter = '';
    this.baseFilter = '';
    this.currentPage = 0;
    this.applyFiltersAndSearch();
    
    // Reset the radio button for price range
    const allPriceRadio = document.getElementById('price-all') as HTMLInputElement;
    if (allPriceRadio) {
      allPriceRadio.checked = true;
    }
  }
  onPizzaClick(pizzaId: number){
    // Navigate to the pizza detail page
    this.router.navigate(['/pizzas', pizzaId]);
  }

  // Update calculateAverageRating method to handle the new review format
  calculateAverageRating(reviews: any[]): number {
    if (!reviews || reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
  }

  // Add this method to get rating for a specific pizza
  getRating(pizzaId: number): number {
    debugger
    return this.pizzaRatings[pizzaId] || 5; // Default to 5 if no rating exists
  }

  // Method to open the review modal
  openReviewModal(pizza: Pizza): void {
    this.selectedPizzaForReview = pizza;
    this.reviewModalVisible = true;
    this.isLoadingReviews = true;
    this.reviewError = '';
    this.currentReviews = [];
    
    this.reviewService.getReviewByPizzaId([pizza.id]).subscribe({
      next: (reviews: any[]) => {
        this.currentReviews = reviews;
        this.isLoadingReviews = false;
      },
      error: (error) => {
        console.error(`Error fetching reviews for pizza ${pizza.id}:`, error);
        this.reviewError = 'Không thể tải đánh giá. Vui lòng thử lại sau.';
        this.isLoadingReviews = false;
      }
    });
  }
  
  // Method to close the review modal
  closeReviewModal(): void {
    this.reviewModalVisible = false;
  }
  
  // Format date for reviews
  formatReviewDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get the label for the selected price range
  getPriceRangeLabel(): string {
    if (!this.priceRange) return '';
    
    const foundRange = this.priceRanges.find(range => range.value === this.priceRange);
    return foundRange ? foundRange.label : '';
  }
  
  // Clear the price filter
  clearPriceFilter(): void {
    this.priceRange = '';
    this.minPrice = 0;
    this.maxPrice = 10000000;
    this.applyFilters();
    
    // Reset the radio button for price range
    const allPriceRadio = document.getElementById('price-all') as HTMLInputElement;
    if (allPriceRadio) {
      allPriceRadio.checked = true;
    }
  }

  // Add method to get sales count
  getSalesCount(pizzaId: number): number {
    return this.pizzaSalesCounts[pizzaId] || 0;
  }
}
