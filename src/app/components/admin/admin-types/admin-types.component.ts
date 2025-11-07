import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TypeService } from '../../../service/type.service';
import { Type } from '../../../model/type';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-admin-types',
  standalone: false,
  templateUrl: './admin-types.component.html',
  styleUrl: './admin-types.component.scss',
  providers: [MessageService]
})
export class AdminTypesComponent implements OnInit {
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
  selectedType: any = null;
  typeIdToDelete: number | null = null;
  newType: any = {
    base_name: '',
    price: 0
  };
  
  // Error message variables
  typeNameError: string = '';
  priceError: string = '';
  
  // New type error message variables
  newTypeNameError: string = '';
  newPriceError: string = '';
  
  // Type data
  types: Type[] = [];
  filteredTypes: Type[] = [];
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private messageService: MessageService,
    private typeService: TypeService
  ) { }

  ngOnInit(): void {
    this.loadTypes();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadTypes(): void {
    this.isLoading = true;
    this.typeService.getTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.types = response;
          this.totalItems = this.types.length;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.filterTypes();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching types:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải dữ liệu phân loại. Vui lòng thử lại sau.'
          });
          this.isLoading = false;
        }
      });
  }
  
  // Search functionality
  onSearch(): void {
    this.currentPage = 1;
    this.filterTypes();
  }
  
  // Filter types based on search term
  filterTypes(): void {
    let filtered = [...this.types];
    
    // Filter by search term
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(type => 
        type.base_name.toLowerCase().includes(searchTermLower) ||
        type.id.toString().includes(searchTermLower) ||
        type.price.toString().includes(searchTermLower)
      );
    }
    
    // Sort the filtered results
    this.sortTypes(filtered);
    
    this.filteredTypes = filtered;
    this.totalItems = this.filteredTypes.length;
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
    
    this.sortTypes(this.filteredTypes);
  }
  
  // Sort types array
  sortTypes(typesArray: Type[]): void {
    typesArray.sort((a, b) => {
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
  
  getCurrentPageItems(): Type[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredTypes.length);
    return this.filteredTypes.slice(startIndex, endIndex);
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
    // Reset new type data
    this.newType = {
      base_name: '',
      price: 0
    };
    
    // Reset error messages
    this.resetNewTypeErrors();
    
    // Show modal
    document.getElementById('addTypeModal')?.classList.add('show');
  }
  
  openEditModal(type: Type): void {
    // Clone the type to avoid direct mutation
    this.selectedType = { ...type };
    
    // Reset error messages
    this.resetEditErrors();
    
    // Show modal
    document.getElementById('editTypeModal')?.classList.add('show');
  }
  
  confirmDeleteType(typeId: number, event: Event): void {
    // Prevent event bubbling
    event.stopPropagation();
    
    // Set the type ID to delete
    this.typeIdToDelete = typeId;
    
    // Show confirmation modal
    document.getElementById('confirmDeleteModal')?.classList.add('show');
  }
  
  // Add new type
  addNewType(): void {
    // Validate inputs
    let isValid = true;
    
    if (!this.newType.base_name || this.newType.base_name.trim() === '') {
      this.newTypeNameError = 'Vui lòng nhập tên loại';
      isValid = false;
    } else {
      this.newTypeNameError = '';
    }
    
    if (this.newType.price < 0) {
      this.newPriceError = 'Giá thêm không thể âm';
      isValid = false;
    } else {
      this.newPriceError = '';
    }
    
    if (!isValid) {
      return;
    }
    
    // Submit form
    this.isSubmitting = true;
    
    const typeData = {
      base_name: this.newType.base_name.trim(),
      price: this.newType.price
    };
    
    this.typeService.createType(typeData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm phân loại mới thành công'
          });
          
          // Hide modal
          document.getElementById('addTypeModal')?.classList.remove('show');
          
          // Reload types
          this.loadTypes();
          
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error creating type:', error);
          
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.error?.message || 'Không thể thêm phân loại. Vui lòng thử lại sau.'
          });
          
          this.isSubmitting = false;
        }
      });
  }
  
  // Update type
  updateType(): void {
    // Validate inputs
    let isValid = true;
    
    if (!this.selectedType.base_name || this.selectedType.base_name.trim() === '') {
      this.typeNameError = 'Vui lòng nhập tên loại';
      isValid = false;
    } else {
      this.typeNameError = '';
    }
    
    if (this.selectedType.price < 0) {
      this.priceError = 'Giá thêm không thể âm';
      isValid = false;
    } else {
      this.priceError = '';
    }
    
    if (!isValid) {
      return;
    }
    
    // Submit form
    this.isSubmitting = true;
    
    const typeData = {
      base_name: this.selectedType.base_name.trim(),
      price: this.selectedType.price
    };
    
    this.typeService.updateType(this.selectedType.id, typeData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật phân loại thành công'
          });
          
          // Hide modal
          document.getElementById('editTypeModal')?.classList.remove('show');
          
          // Reload types
          this.loadTypes();
          
          this.isSubmitting = false;
        },
        error: (error) => {
          
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật phân loại thành công'
          });
          
           // Hide modal
           document.getElementById('editTypeModal')?.classList.remove('show');
          
           // Reload types
           this.loadTypes();
           
           this.isSubmitting = false;
        }
      });
  }
  
  // Delete type
  proceedDelete(): void {
    if (!this.typeIdToDelete) {
      return;
    }
    
    this.isDeleting = true;
    
    this.typeService.deleteType(this.typeIdToDelete)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa phân loại thành công'
          });
          
          // Hide modal
          document.getElementById('confirmDeleteModal')?.classList.remove('show');
          
          // Reload types
          this.loadTypes();
          
          this.isDeleting = false;
          this.typeIdToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting type:', error);
          
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa phân loại thành công'
          });
           // Hide modal
           document.getElementById('confirmDeleteModal')?.classList.remove('show');
          
           // Reload types
           this.loadTypes();
           
           this.isDeleting = false;
           this.typeIdToDelete = null;
        }
      });
  }
  
  // Reset error messages
  resetEditErrors(): void {
    this.typeNameError = '';
    this.priceError = '';
  }
  
  resetNewTypeErrors(): void {
    this.newTypeNameError = '';
    this.newPriceError = '';
  }
}
