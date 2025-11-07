import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PizzaService } from '../../../service/pizza.service';
import { Pizza } from '../../../model/pizza';
import { environment } from '../../../environments/environments';
import { PizzaImage } from '../../../model/pizza.image';
import { PizzaDTO } from '../../../dtos/pizza/pizza.dto';
import { MessageService } from 'primeng/api';
import { ReviewService } from '../../../service/review.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-pizzas',
  standalone: false,
  templateUrl: './admin-pizzas.component.html',
  styleUrl: './admin-pizzas.component.scss',
  providers: [MessageService]
})
export class AdminPizzasComponent implements OnInit, OnDestroy {
  searchTerm = '';
  typeFilter = 'all';
  statusFilter = 'all';
  isLoading = false;
  pizzas: Pizza[] = [];
  filteredPizzas: Pizza[] = [];
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  sortBy = 'id';
  sortDirection = 'asc';
  minPrice = 0;
  maxPrice = 1000000;
  selectedPizza: Pizza | null = null;
  private destroy$ = new Subject<void>();
  isSubmitting = false;
  selectedFile: File | null = null;
  previewImageURL: string | null = null;
  selectedPizzaId: number | null = null;
  isDeleting = false;
  
  // New pizza file handling
  newPizzaFile: File | null = null;
  newPizzaImageURL: string | null = null;
  newPizzaFileError: string | null = null;
  
  // Form validation errors
  nameError: string | null = null;
  priceError: string | null = null;
  descriptionError: string | null = null;
  
  // New pizza form data
  newPizza: {
    name: string;
    base_price: number;
    description: string;
  } = {
    name: '',
    base_price: 0,
    description: ''
  };
  
  // New pizza validation errors
  newPizzaNameError: string | null = null;
  newPizzaPriceError: string | null = null;
  newPizzaDescriptionError: string | null = null;

  // Reviews related properties
  isViewingReviews = false;
  currentReviews: any[] = [];
  selectedPizzaForReview: Pizza | null = null;
  isLoadingReviews = false;
  reviewError = '';
  
  // Review deletion properties
  selectedReviewId: number | null = null;
  isDeletingReview = false;

  constructor(
    private messageService: MessageService,
    private pizzaService: PizzaService,
    private http: HttpClient,
    private reviewService: ReviewService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPizzas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPizzas(): void {
    this.isLoading = true;
    this.getPizzas(this.sortBy, this.minPrice, this.maxPrice, this.searchTerm, this.currentPage - 1, this.pageSize);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadPizzas();
  }

  openAddModal(): void {
    // Reset the new pizza form
    this.newPizza = {
      name: '',
      base_price: 0,
      description: ''
    };
    
    // Reset validation errors
    this.resetNewPizzaErrors();
    
    // Reset file input
    this.resetNewPizzaFileInput();
    
    document.getElementById('addPizzaModal')?.classList.add('show');
  }
  
  resetNewPizzaErrors(): void {
    this.newPizzaNameError = null;
    this.newPizzaPriceError = null;
    this.newPizzaDescriptionError = null;
    this.newPizzaFileError = null;
  }
  
  resetNewPizzaFileInput(): void {
    this.newPizzaFile = null;
    if (this.newPizzaImageURL) {
      URL.revokeObjectURL(this.newPizzaImageURL);
      this.newPizzaImageURL = null;
    }
  }
  
  onNewPizzaFileSelected(event: any): void {
    const fileInput = event.target;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      
      if (!file.type.match('image/jpeg') && !file.type.match('image/jpg') && !file.type.match('image/png')) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Vui lòng chọn file ảnh jpg, jpeg hoặc png'
        });
        fileInput.value = '';
        return;
      }
      
      this.newPizzaFile = file;
      this.newPizzaImageURL = URL.createObjectURL(file);
    }
  }

  setTypeFilter(type: string): void { 
    this.typeFilter = type;
    this.filterPizzas();
  }

  setStatusFilter(status: string): void { 
    this.statusFilter = status;
    this.filterPizzas();
  }

  resetFilters(): void {
    this.typeFilter = 'all';
    this.statusFilter = 'all';
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadPizzas();
  }

  getCurrentPageItems(): Pizza[] { 
    return this.filteredPizzas; 
  }

  getPageNumbers(): number[] {
    const pages = [];
    const totalVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(totalVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + totalVisiblePages - 1);

    if (endPage - startPage + 1 < totalVisiblePages) {
      startPage = Math.max(1, endPage - totalVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  openEditModal(pizza: Pizza): void {
    this.isSubmitting = false;
    this.resetFileInput();
    this.resetValidationErrors();
    this.getDetailPizza(pizza.id);
  }
  
  resetValidationErrors(): void {
    this.nameError = null;
    this.priceError = null;
    this.descriptionError = null;
  }
  
  // Sorting functionality
  sort(column: string): void {
    // If clicking the same column, toggle direction
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Clicking a new column, default to ascending
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    
    this.sortPizzas();
  }
  
  getSortIcon(column: string): string {
    if (this.sortBy !== column) {
      return 'fa-sort'; // Default icon
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }
  
  sortPizzas(): void {
    const sortedPizzas = [...this.filteredPizzas];
    
    sortedPizzas.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.base_price - b.base_price;
          break;
        default:
          comparison = 0;
      }
      
      // Reverse if descending
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    
    this.filteredPizzas = sortedPizzas;
  }

  getDetailPizza(pizzaId: number): void {
    this.isLoading = true;
    this.pizzaService.getDetailPizza(pizzaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.pizza_images && response.pizza_images.length > 0) {
            response.pizza_images.forEach((pizza_image: PizzaImage) => {
              pizza_image.image_url = `${environment.apiBaseUrl}/pizzas/images/${pizza_image.image_url}`;
            });
            response.url = response.pizza_images[response.pizza_images.length - 1].image_url;
          }
          if (!response.url) {
            response.url = `${environment.apiBaseUrl}/pizzas/images/${response.thumbnail}`;
          }
          
          this.selectedPizza = response;
          this.isLoading = false;
          
          document.getElementById('editPizzaModal')?.classList.add('show');
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể lấy thông tin chi tiết pizza. Vui lòng thử lại sau.'
          });
          this.isLoading = false;
        }
      });
  }
  
  validatePizzaData(pizza: any): boolean {
    let isValid = true;
    
    // Validate name (3-200 characters)
    if (!pizza.name || pizza.name.trim().length < 3 || pizza.name.trim().length > 200) {
      this.nameError = 'Tên phải có từ 3 đến 200 ký tự';
      isValid = false;
    } else {
      this.nameError = null;
    }
    
    // Validate price (0-10000000)
    if (pizza.base_price === null || pizza.base_price === undefined || 
        isNaN(pizza.base_price) || pizza.base_price < 0 || pizza.base_price > 10000000) {
      this.priceError = 'Giá phải từ 0 đến 10.000.000 VND';
      isValid = false;
    } else {
      this.priceError = null;
    }
    
    // Validate description (max 255 characters)
    if (!pizza.description || pizza.description.trim().length === 0) {
      this.descriptionError = 'Mô tả không được để trống';
      isValid = false;
    } else if (pizza.description && pizza.description.length > 255) {
      this.descriptionError = 'Mô tả không được vượt quá 255 ký tự';
      isValid = false;
    } else {
      this.descriptionError = null;
    }
    
    return isValid;
  }
  
  validateNewPizza(): boolean {
    let isValid = true;
    
    // Validate name (3-200 characters)
    if (!this.newPizza.name || this.newPizza.name.trim().length < 3 || this.newPizza.name.trim().length > 200) {
      this.newPizzaNameError = 'Tên phải có từ 3 đến 200 ký tự';
      isValid = false;
    } else {
      this.newPizzaNameError = null;
    }
    
    // Validate price (0-10000000)
    if (this.newPizza.base_price === null || this.newPizza.base_price === undefined || 
        isNaN(this.newPizza.base_price) || this.newPizza.base_price < 0 || this.newPizza.base_price > 10000000) {
      this.newPizzaPriceError = 'Giá phải từ 0 đến 10.000.000 VND';
      isValid = false;
    } else {
      this.newPizzaPriceError = null;
    }
    
    // Validate description (max 255 characters)
    if (!this.newPizza.description || this.newPizza.description.trim().length === 0) {
      this.newPizzaDescriptionError = 'Mô tả không được để trống';
      isValid = false;
    } else if (this.newPizza.description && this.newPizza.description.length > 255) {
      this.newPizzaDescriptionError = 'Mô tả không được vượt quá 255 ký tự';
      isValid = false;
    } else {
      this.newPizzaDescriptionError = null;
    }
    
    // Validate file
    if (!this.newPizzaFile) {
      this.newPizzaFileError = 'Vui lòng chọn hình ảnh cho pizza';
      isValid = false;
    } else {
      this.newPizzaFileError = null;
    }
    
    return isValid;
  }

  updatePizza(): void {
    if (!this.selectedPizza) return;
    
    // Validate the data before submitting
    if (!this.validatePizzaData(this.selectedPizza)) {
      return;
    }
    
    this.isSubmitting = true;
    
    const pizzaDTO: PizzaDTO = {
      name: this.selectedPizza.name,
      title: this.selectedPizza.name,
      base_price: this.selectedPizza.base_price,
      description: this.selectedPizza.description || ''
    };
    
    this.pizzaService.updatePizza(this.selectedPizza.id, pizzaDTO)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Pizza updated successfully:', response);
          
          if (this.selectedFile) {
            this.uploadPizzaImage(this.selectedPizza!.id, this.selectedFile);
          } else {
            this.finishUpdate();
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật pizza. Vui lòng thử lại sau.'
          });
          this.isSubmitting = false;
        }
      });
  }
  
  addNewPizza(): void {
    // Validate the data
    if (!this.validateNewPizza()) {
      return;
    }
    
    this.isSubmitting = true;
    
    const pizzaDTO: PizzaDTO = {
      name: this.newPizza.name,
      title: this.newPizza.name,
      base_price: this.newPizza.base_price,
      description: this.newPizza.description || ''
    };
    
    this.pizzaService.createPizza(pizzaDTO)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          debugger
          console.log('Pizza created successfully:', response);
          
          if (this.newPizzaFile && response.id) {
            this.uploadNewPizzaImage(response.id, this.newPizzaFile);
          } else {
            this.finishAddPizza();
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể thêm pizza mới. Vui lòng thử lại sau.'
          });
          this.isSubmitting = false;
        }
      });
  }
  
  uploadNewPizzaImage(pizzaId: number, file: File): void {
    this.pizzaService.createPizzaImage(pizzaId, file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('New pizza image uploaded successfully:', response);
          this.finishAddPizza();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Pizza đã được tạo, nhưng không thể tải lên ảnh. Vui lòng thử lại sau.'
          });
          this.finishAddPizza();
        }
      });
  }
  
  finishAddPizza(): void {
    this.isSubmitting = false;
    document.getElementById('addPizzaModal')?.classList.remove('show');
    this.loadPizzas();
    this.resetNewPizzaFileInput();
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Thêm pizza mới thành công!'
    });
  }

  uploadPizzaImage(pizzaId: number, file: File): void {
    this.pizzaService.createPizzaImage(pizzaId, file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Pizza image uploaded successfully:', response);
          this.finishUpdate();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Thông tin pizza đã được cập nhật, nhưng không thể tải lên ảnh mới. Vui lòng thử lại sau.'
          });
          this.finishUpdate();
          
        }
      });
  }

  finishUpdate(): void {
    this.isSubmitting = false;
    document.getElementById('editPizzaModal')?.classList.remove('show');
    this.loadPizzas();
    this.resetFileInput();
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Cập nhật pizza thành công!'
    });

  }

  resetFileInput(): void {
    this.selectedFile = null;
    if (this.previewImageURL) {
      URL.revokeObjectURL(this.previewImageURL);
      this.previewImageURL = null;
    }
  }

  confirmDeletePizza(id: number, event: Event): void {
    event.stopPropagation();
    document.getElementById('confirmDeleteModal')?.classList.add('show');
    this.selectedPizzaId = id;
  }

  cancelDelete(): void {
    document.getElementById('confirmDeleteModal')?.classList.remove('show');
    this.selectedPizzaId = null;
  }

  proceedDelete(): void {
    if (!this.selectedPizzaId) return;
    
    this.isDeleting = true;
    this.pizzaService.deletePizza(this.selectedPizzaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          debugger
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Pizza đã được xóa thành công'
          });
          this.isDeleting = false;
          document.getElementById('confirmDeleteModal')?.classList.remove('show');
          this.loadPizzas();
          this.selectedPizzaId = null;
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Pizza đã được xóa thành công'
          });
          this.isDeleting = false;
        }
      });
  }

  changePage(page: number): void { 
    this.currentPage = page;
    this.loadPizzas();
  }

  getStartItem(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  getPizzas(sortBy: string, minPrice: number, maxPrice: number, keyword: string, currentPage: number, itemsPerPage: number): void {
    this.isLoading = true;
    console.log('Searching with keyword:', keyword);
    
    this.pizzaService.getPizzas(sortBy, minPrice, maxPrice, keyword, currentPage, itemsPerPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('Pizza search response:', response);
          if (response.pizzas) {
            response.pizzas.forEach((pizza: Pizza) => {
              pizza.url = `${environment.apiBaseUrl}/pizzas/images/${pizza.thumbnail}`;
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
            this.filteredPizzas = this.pizzas;
            this.totalItems = response.totalItems || this.pizzas.length;
            this.totalPages = response.totalPages || Math.ceil(this.totalItems / this.pageSize);
          } else {
            // Handle case when response is an array instead of object with pizzas property
            this.pizzas = response;
            this.filteredPizzas = this.pizzas;
            this.totalItems = this.pizzas.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          }
          this.filterPizzas();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching pizzas:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tìm kiếm pizza. Vui lòng thử lại sau.'
          });
          this.isLoading = false;
        }
      });
  }

  filterPizzas(): void {
    let filtered = [...this.pizzas];
    
    // Filter by type if not 'all'
    if (this.typeFilter !== 'all') {
      filtered = filtered.filter((pizza: any) => pizza.type === this.typeFilter);
    }
    
    // Filter by status if not 'all'
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((pizza: any) => {
        if (this.statusFilter === 'available') {
          return pizza.is_active;
        } else if (this.statusFilter === 'out_of_stock') {
          return !pizza.is_active;
        }
        return true;
      });
    }
    
    this.filteredPizzas = filtered;
    this.totalItems = this.filteredPizzas.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    // Apply sorting if needed
    this.sortPizzas();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

  onFileSelected(event: any): void {
    const fileInput = event.target;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      
      if (!file.type.match('image/jpeg') && !file.type.match('image/jpg') && !file.type.match('image/png')) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Vui lòng chọn file ảnh jpg, jpeg hoặc png'
        });
        fileInput.value = '';
        return;
      }
      
      this.selectedFile = file;
      
      this.previewImageURL = URL.createObjectURL(file);
    }
  }

  // New method to open reviews modal
  openReviewsModal(pizza: Pizza): void {
    this.selectedPizzaForReview = pizza;
    this.isLoadingReviews = true;
    this.reviewError = '';
    this.currentReviews = [];
    
    this.reviewService.getReviewByPizzaId([pizza.id])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reviews: any[]) => {
          this.currentReviews = reviews;
          this.isLoadingReviews = false;
          // Show the modal
          const reviewsModal = document.getElementById('viewReviewsModal');
          if (reviewsModal) {
            reviewsModal.classList.add('show');
          }
        },
        error: (error) => {
          this.reviewError = 'Không thể tải đánh giá. Vui lòng thử lại sau.';
          this.isLoadingReviews = false;
          console.error('Error fetching reviews:', error);
          // Still show the modal even if there's an error
          const reviewsModal = document.getElementById('viewReviewsModal');
          if (reviewsModal) {
            reviewsModal.classList.add('show');
          }
        }
      });
  }
  
  // Method to close reviews modal
  closeReviewsModal(): void {
    const reviewsModal = document.getElementById('viewReviewsModal');
    if (reviewsModal) {
      reviewsModal.classList.remove('show');
    }
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
  
  // Calculate average rating
  calculateAverageRating(reviews: any[]): number {
    if (!reviews || reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
  }

  // Method to confirm delete review
  confirmDeleteReview(reviewId: number): void {
    this.selectedReviewId = reviewId;
    const confirmModal = document.getElementById('confirmDeleteReviewModal');
    if (confirmModal) {
      confirmModal.classList.add('show');
    }
  }
  
  // Method to cancel delete review
  cancelDeleteReview(): void {
    const confirmModal = document.getElementById('confirmDeleteReviewModal');
    if (confirmModal) {
      confirmModal.classList.remove('show');
    }
    this.selectedReviewId = null;
  }
  
  // Method to proceed with review deletion
  proceedDeleteReview(): void {
    if (!this.selectedReviewId) return;
    
    this.isDeletingReview = true;
    this.reviewService.deleteReview(this.selectedReviewId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đánh giá đã được xóa thành công'
          });
          
          // Remove the deleted review from the list
          this.currentReviews = this.currentReviews.filter(review => review.id !== this.selectedReviewId);
          
          // Close the confirmation modal
          this.cancelDeleteReview();
          this.isDeletingReview = false;
          this.closeReviewsModal();

          this.router.navigate(['/admin/pizzas']);
        },
        error: (error) => {
          console.error('Error deleting review:', error);
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đánh giá đã được xóa thành công'
          });
          this.cancelDeleteReview();
          this.isDeletingReview = false;
          this.closeReviewsModal();
        }
      });
  }
}
