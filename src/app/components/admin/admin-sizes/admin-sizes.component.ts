import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { SizeService } from '../../../service/size.service';
import { Size } from '../../../model/size';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-admin-sizes',
  standalone: false,
  templateUrl: './admin-sizes.component.html',
  styleUrl: './admin-sizes.component.scss',
  providers: [MessageService]
})
export class AdminSizesComponent implements OnInit {
  // Make Math available in the template
  Math = Math;
  
  // Variables for search and filtering
  searchTerm: string = '';
  
  // Pagination variables
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;
  
  // Sorting variables
  sortField: string = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Loading state variables
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  isDeleting: boolean = false;
  
  // Modal data variables
  selectedSize: any = null;
  sizeIdToDelete: number | null = null;
  newSize: any = {
    size_name: '',
    price_multiplier: 1.0
  };
  
  // Error message variables
  sizeNameError: string = '';
  priceMultiplierError: string = '';
  
  // New size error message variables
  newSizeNameError: string = '';
  newPriceMultiplierError: string = '';
  
  // Size data
  sizes: Size[] = [];
  filteredSizes: Size[] = [];
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private messageService: MessageService,
    private sizeService: SizeService
  ) { }

  ngOnInit(): void {
    this.loadSizes();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadSizes(): void {
    this.isLoading = true;
    this.sizeService.getSizes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.sizes) {
            this.sizes = response.sizes;
            this.totalItems = response.totalItems || this.sizes.length;
            this.totalPages = response.totalPages || Math.ceil(this.totalItems / this.pageSize);
          } else {
            this.sizes = response;
            this.totalItems = this.sizes.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          }
          this.filterSizes();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching sizes:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải dữ liệu kích thước. Vui lòng thử lại sau.'
          });
          this.isLoading = false;
        }
      });
  }
  
  // Search functionality
  onSearch(): void {
    this.currentPage = 1;
    this.filterSizes();
  }
  
  // Filter sizes based on search term
  filterSizes(): void {
    let filtered = [...this.sizes];
    
    // Filter by search term
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(size => 
        size.size_name.toLowerCase().includes(searchTermLower) ||
        size.id.toString().includes(searchTermLower) ||
        (size.price_multiplier * 100).toString().includes(searchTermLower)
      );
    }
    
    // Sort the filtered results
    this.sortSizes(filtered);
    
    this.filteredSizes = filtered;
    this.totalItems = this.filteredSizes.length;
    this.calculateTotalPages();
  }
  
  // Sorting functionality
  sort(field: string): void {
    if (this.sortField === field) {
      // Toggle sort direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.sortSizes(this.filteredSizes);
  }
  
  // Sort sizes array
  sortSizes(sizesArray: Size[]): void {
    sizesArray.sort((a, b) => {
      let aValue: any, bValue: any;
      
      // Handle nested properties
      if (this.sortField.includes('.')) {
        const parts = this.sortField.split('.');
        aValue = a;
        bValue = b;
        
        for (const part of parts) {
          if (aValue && bValue) {
            aValue = aValue[part as keyof typeof aValue];
            bValue = bValue[part as keyof typeof bValue];
          }
        }
      } else {
        aValue = (a as any)[this.sortField];
        bValue = (b as any)[this.sortField];
      }
      
      // Handle null or undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        if (aValue < bValue) {
          return this.sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return this.sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      }
    });
  }
  
  // Get sort icon based on current sort field and direction
  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'fa-sort';
    }
    
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }
  
  // Pagination methods
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
  }
  
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }
  
  getCurrentPageItems(): Size[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredSizes.length);
    return this.filteredSizes.slice(startIndex, endIndex);
  }
  
  getStartItem(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }
  
  getEndItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }
  
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show limited pages with current page in the middle if possible
      let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = startPage + maxPagesToShow - 1;
      
      if (endPage > this.totalPages) {
        endPage = this.totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
  
  // Modal methods
  openAddModal(): void {
    // Reset new size data
    this.newSize = {
      size_name: '',
      price_multiplier: 1.0
    };
    
    // Reset error messages
    this.resetNewSizeErrors();
    
    // Show modal
    document.getElementById('addSizeModal')?.classList.add('show');
  }
  
  openEditModal(size: Size): void {
    // Clone the size to avoid direct mutation
    this.selectedSize = { ...size };
    
    // Reset error messages
    this.resetEditErrors();
    
    // Show modal
    document.getElementById('editSizeModal')?.classList.add('show');
  }
  
  confirmDeleteSize(sizeId: number, event: Event): void {
    // Prevent event bubbling
    event.stopPropagation();
    
    // Set the size ID to delete
    this.sizeIdToDelete = sizeId;
    
    // Show confirmation modal
    document.getElementById('confirmDeleteModal')?.classList.add('show');
  }
  
  // Format price multiplier to show as percentage
  formatPriceMultiplier(): void {
    if (this.selectedSize && this.selectedSize.price_multiplier) {
      // Ensure it's a number between 0 and 1
      this.selectedSize.price_multiplier = parseFloat(this.selectedSize.price_multiplier.toString());
      if (this.selectedSize.price_multiplier > 10) {
        this.selectedSize.price_multiplier = this.selectedSize.price_multiplier / 100;
      }
    }
  }
  
  formatNewPriceMultiplier(): void {
    if (this.newSize && this.newSize.price_multiplier) {
      // Ensure it's a number between 0 and 1
      this.newSize.price_multiplier = parseFloat(this.newSize.price_multiplier.toString());
      if (this.newSize.price_multiplier > 10) {
        this.newSize.price_multiplier = this.newSize.price_multiplier / 100;
      }
    }
  }
  
  // Add new size
  addNewSize(): void {
    // Validate inputs
    let isValid = true;
    
    if (!this.newSize.size_name || this.newSize.size_name.trim() === '') {
      this.newSizeNameError = 'Vui lòng nhập tên kích thước';
      isValid = false;
    } else {
      this.newSizeNameError = '';
    }
    
    if (!this.newSize.price_multiplier || this.newSize.price_multiplier <= 0) {
      this.newPriceMultiplierError = 'Hệ số giá phải lớn hơn 0';
      isValid = false;
    } else {
      this.newPriceMultiplierError = '';
    }
    
    if (!isValid) {
      return;
    }
    
    // Submit form
    this.isSubmitting = true;
    
    const sizeData = {
      size_name: this.newSize.size_name.trim(),
      price_multiplier: this.newSize.price_multiplier
    };
    
    this.sizeService.createSize(sizeData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm kích thước mới thành công'
          });
          
          // Hide modal
          document.getElementById('addSizeModal')?.classList.remove('show');
          
          // Reload sizes
          this.loadSizes();
          
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error creating size:', error);
          
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.error?.message || 'Không thể thêm kích thước. Vui lòng thử lại sau.'
          });
          
          this.isSubmitting = false;
        }
      });
  }
  
  // Update size
  updateSize(): void {
    // Validate inputs
    let isValid = true;
    
    if (!this.selectedSize.size_name || this.selectedSize.size_name.trim() === '') {
      this.sizeNameError = 'Vui lòng nhập tên kích thước';
      isValid = false;
    } else {
      this.sizeNameError = '';
    }
    
    if (!this.selectedSize.price_multiplier || this.selectedSize.price_multiplier <= 0) {
      this.priceMultiplierError = 'Hệ số giá phải lớn hơn 0';
      isValid = false;
    } else {
      this.priceMultiplierError = '';
    }
    
    if (!isValid) {
      return;
    }
    
    // Submit form
    this.isSubmitting = true;
    
    const sizeData = {
      size_name: this.selectedSize.size_name.trim(),
      price_multiplier: this.selectedSize.price_multiplier
    };
    
    this.sizeService.updateSize(this.selectedSize.id, sizeData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật kích thước thành công'
          });
          
          // Hide modal
          document.getElementById('editSizeModal')?.classList.remove('show');
          
          // Reload sizes
          this.loadSizes();
          
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error updating size:', error);
          
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.error?.message || 'Không thể cập nhật kích thước. Vui lòng thử lại sau.'
          });
          
          this.isSubmitting = false;
        }
      });
  }
  
  // Delete size
  proceedDelete(): void {
    if (!this.sizeIdToDelete) {
      return;
    }
    
    this.isDeleting = true;
    
    this.sizeService.deleteSize(this.sizeIdToDelete)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa kích thước thành công'
          });
          
          // Hide modal
          document.getElementById('confirmDeleteModal')?.classList.remove('show');
          
          // Reload sizes
          this.loadSizes();
          
          this.isDeleting = false;
          this.sizeIdToDelete = null;
          document.getElementById('confirmDeleteModal')?.classList.remove('show');
        },
        error: (error) => {
          console.error('Error deleting size:', error);
          
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa kích thước thành công'
          });
          
          this.loadSizes();
          
          this.isDeleting = false;
          this.sizeIdToDelete = null;
          document.getElementById('confirmDeleteModal')?.classList.remove('show');

        }
      });
  }
  
  // Reset error messages
  resetEditErrors(): void {
    this.sizeNameError = '';
    this.priceMultiplierError = '';
  }
  
  resetNewSizeErrors(): void {
    this.newSizeNameError = '';
    this.newPriceMultiplierError = '';
  }
}
