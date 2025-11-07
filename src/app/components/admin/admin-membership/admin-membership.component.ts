import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { MembershipService } from '../../../service/membership.service';
import { Membership } from '../../../model/membership';
import { MembershipDTO } from '../../../dtos/membership/membership.dto';

@Component({
  selector: 'app-admin-membership',
  standalone: false,
  templateUrl: './admin-membership.component.html',
  styleUrl: './admin-membership.component.scss',
  providers: [MessageService]
})
export class AdminMembershipComponent implements OnInit {
  // Membership tier constants with discount rates
  public static readonly MEMBER_BRONZE = "Bronze";
  public static readonly MEMBER_SILVER = "Silver";
  public static readonly MEMBER_GOLD = "Gold";
  public static readonly MEMBER_PLATINUM = "Platinum";

  public static readonly DISCOUNT_BRONZE = 0.0;
  public static readonly DISCOUNT_SILVER = 2.0;
  public static readonly DISCOUNT_GOLD = 3.0;
  public static readonly DISCOUNT_PLATINUM = 5.0;

  // Variables for search and filtering
  searchTerm: string = '';
  levelFilter: string = 'all';
  
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
  selectedMembership: Membership | null = null;
  selectedMembershipId: number | null = null;
  
  // Error message variables
  phoneError: string = '';
  totalSpendingError: string = '';
  levelError: string = '';
  discountRateError: string = '';
  
  // Membership data
  memberships: Membership[] = [];
  filteredMemberships: Membership[] = [];
  
  // Add new membership variables
  searchPhone: string = '';
  isSearching: boolean = false;
  searchPhoneError: string = '';
  phoneExists: boolean = false;
  showAddMemberForm: boolean = false;
  newMembership: Membership = {
    id: 0,
    phone: '',
    total_spent: 0,
    membership_tier: 'Bronze',
    discount_rate: 5
  };
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private messageService: MessageService,
    private membershipService: MembershipService
  ) { }

  ngOnInit(): void {
    this.loadMemberships();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadMemberships(): void {
    this.isLoading = true;
    
    this.membershipService.getMemberships()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.memberships = data;
          this.totalItems = this.memberships.length;
          this.calculateTotalPages();
          this.filterMemberships();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading memberships:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải danh sách thành viên. Vui lòng thử lại sau.'
          });
          this.isLoading = false;
        }
      });
  }
  
  // Search functionality
  onSearch(): void {
    this.currentPage = 1;
    this.filterMemberships();
  }
  
  // Filter by membership level
  setLevelFilter(level: string): void {
    this.levelFilter = level;
    this.filterMemberships();
  }
  
  // Reset all filters
  resetFilters(): void {
    this.searchTerm = '';
    this.levelFilter = 'all';
    this.currentPage = 1;
    this.filterMemberships();
  }
  
  // Filter memberships based on search term and level
  filterMemberships(): void {
    let filtered = [...this.memberships];
    
    // Filter by search term
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(membership => 
        membership.phone.toLowerCase().includes(searchTermLower) ||
        membership.id.toString().includes(searchTermLower)
      );
    }
    
    // Filter by level if not 'all'
    if (this.levelFilter !== 'all') {
      filtered = filtered.filter(membership => 
        membership.membership_tier.toLowerCase() === this.levelFilter.toLowerCase()
      );
    }
    
    // Sort the filtered results
    this.sortMemberships(filtered);
    
    this.filteredMemberships = filtered;
    this.totalItems = this.filteredMemberships.length;
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
    
    this.sortMemberships(this.filteredMemberships);
  }
  
  // Sort memberships array
  sortMemberships(membershipsArray: Membership[]): void {
    membershipsArray.sort((a, b) => {
      let aValue: any = (a as any)[this.sortField];
      let bValue: any = (b as any)[this.sortField];
      
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
  
  getCurrentPageItems(): Membership[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredMemberships.length);
    return this.filteredMemberships.slice(startIndex, endIndex);
  }
  
  getStartItem(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }
  
  getEndItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
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
  
  openEditModal(membership: Membership): void {
    this.resetEditErrors();
    this.selectedMembership = { ...membership };
    document.getElementById('editMembershipModal')?.classList.add('show');
  }
  
  confirmDeleteMembership(membershipId: number, event: Event): void {
    event.stopPropagation();
    this.selectedMembershipId = membershipId;
    document.getElementById('confirmDeleteModal')?.classList.add('show');
  }
  
  updateMembership(): void {
    if (!this.selectedMembership) return;
    
    if (!this.validateMembershipData(this.selectedMembership, true)) {
      return;
    }
    
    this.isSubmitting = true;
    
    // Create a DTO from the selected membership
    const membershipDTO = new MembershipDTO({
      phone: this.selectedMembership.phone,
      total_spent: this.selectedMembership.total_spent,
      membership_tier: this.selectedMembership.membership_tier,
      discount_rate: this.selectedMembership.discount_rate
    });
    debugger
    this.membershipService.updateMembership(this.selectedMembership.id, membershipDTO)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Update the local data
          debugger
          const index = this.memberships.findIndex(m => m.id === this.selectedMembership!.id);
          if (index !== -1) {
            this.memberships[index] = { ...this.selectedMembership! };
          }
          
          this.filterMemberships();
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật thông tin thành viên thành công!'
          });
          
          // Close the modal
          document.getElementById('editMembershipModal')?.classList.remove('show');
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error updating membership:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật thông tin thành viên. Vui lòng thử lại sau.'
          });
          this.isSubmitting = false;
        }
      });
  }
  
  proceedDelete(): void {
    if (!this.selectedMembershipId) return;
    
    this.isDeleting = true;
    
    // Find the phone number of the membership to delete
    const membershipToDelete = this.memberships.find(m => m.id === this.selectedMembershipId);
    
    if (!membershipToDelete) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy thành viên để xóa.'
      });
      this.isDeleting = false;
      document.getElementById('confirmDeleteModal')?.classList.remove('show');
      return;
    }
    debugger
    this.membershipService.deleteMembership(membershipToDelete.phone)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          debugger
          // Remove from local data
          this.memberships = this.memberships.filter(m => m.id !== this.selectedMembershipId);
          this.filterMemberships();
          
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa thành viên thành công!'
          });
          
          // Close the modal
          document.getElementById('confirmDeleteModal')?.classList.remove('show');
          this.selectedMembershipId = null;
          this.isDeleting = false;
        },
        error: (error) => {
          console.error('Error deleting membership:', error);
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa thành viên thành công!'
          });
          document.getElementById('confirmDeleteModal')?.classList.remove('show');
          this.selectedMembershipId = null;
          this.isDeleting = false;
        }
      });
  }
  
  cancelDelete(): void {
    document.getElementById('confirmDeleteModal')?.classList.remove('show');
    this.selectedMembershipId = null;
  }
  
  resetEditErrors(): void {
    this.phoneError = '';
    this.totalSpendingError = '';
    this.levelError = '';
    this.discountRateError = '';
  }
  
  validateMembershipData(membership: Membership, isEdit: boolean = false): boolean {
    let isValid = true;
    
    // Validate phone (only for new memberships)
    if (!isEdit) {
      if (!membership.phone || !/^\d{10}$/.test(membership.phone)) {
        this.phoneError = 'Số điện thoại phải có 10 chữ số';
        isValid = false;
      } else {
        this.phoneError = '';
      }
    }
    
    // For editing, validate total spending (read-only validation)
    if (isEdit) {
      if (membership.total_spent < 0) {
        this.totalSpendingError = 'Tổng chi tiêu không được âm';
        isValid = false;
      } else {
        this.totalSpendingError = '';
      }
    }
    
    // Validate level
    if (!['Bronze', 'Silver', 'Gold', 'Platinum'].includes(membership.membership_tier)) {
      this.levelError = 'Hạng thành viên không hợp lệ';
      isValid = false;
    } else {
      this.levelError = '';
    }
    
    // Discount rate is auto-generated, no need to validate
    this.discountRateError = '';
    
    return isValid;
  }
  
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }
  
  // Open add membership modal
  openAddModal(): void {
    // Reset form
    this.searchPhone = '';
    this.searchPhoneError = '';
    this.phoneExists = false;
    this.showAddMemberForm = false;
    this.resetNewMembership();
    
    document.getElementById('addMembershipModal')?.classList.add('show');
  }
  
  // Reset new membership data
  resetNewMembership(): void {
    this.newMembership = {
      id: 0,
      phone: '',
      total_spent: 0,
      membership_tier: AdminMembershipComponent.MEMBER_BRONZE,
      discount_rate: AdminMembershipComponent.DISCOUNT_BRONZE
    };
  }

  // Get discount rate based on membership tier
  getDiscountRateForTier(tier: string): number {
    switch (tier) {
      case AdminMembershipComponent.MEMBER_BRONZE:
        return AdminMembershipComponent.DISCOUNT_BRONZE;
      case AdminMembershipComponent.MEMBER_SILVER:
        return AdminMembershipComponent.DISCOUNT_SILVER;
      case AdminMembershipComponent.MEMBER_GOLD:
        return AdminMembershipComponent.DISCOUNT_GOLD;
      case AdminMembershipComponent.MEMBER_PLATINUM:
        return AdminMembershipComponent.DISCOUNT_PLATINUM;
      default:
        return AdminMembershipComponent.DISCOUNT_BRONZE;
    }
  }

  // Handle membership tier change for new membership
  onNewMembershipTierChange(): void {
    this.newMembership.discount_rate = this.getDiscountRateForTier(this.newMembership.membership_tier);
  }

  // Handle membership tier change for editing membership
  onEditMembershipTierChange(): void {
    if (this.selectedMembership) {
      this.selectedMembership.discount_rate = this.getDiscountRateForTier(this.selectedMembership.membership_tier);
    }
  }
  
  // Search for member by phone
  searchMemberByPhone(): void {
    // Reset states
    this.phoneExists = false;
    this.showAddMemberForm = false;
    this.searchPhoneError = '';
    
    // Validate phone format
    if (!this.searchPhone || !/^\d{10}$/.test(this.searchPhone)) {
      this.searchPhoneError = 'Vui lòng nhập số điện thoại hợp lệ (10 chữ số)';
      return;
    }
    
    this.isSearching = true;
    
    this.membershipService.getMembershipByUserPhone(this.searchPhone)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (existingMembership) => {
          debugger
          if (existingMembership) {
            // Phone exists
            this.phoneExists = true;
            this.showAddMemberForm = false;
          } else {
            // Phone doesn't exist, show add form
            this.phoneExists = false;
            this.showAddMemberForm = true;
            
            // Set phone in new membership
            this.newMembership.phone = this.searchPhone;
          }
          
          this.isSearching = false;
        },
        error: (error) => {
          if (error.status === 404 || error.status === 400) {
            // 404 means phone not found, which is what we want for adding a new member
            this.phoneExists = false;
            this.showAddMemberForm = true;
            
            // Set phone in new membership
            this.newMembership.phone = this.searchPhone;
          } else {
            console.error('Error searching for phone:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể tìm kiếm số điện thoại. Vui lòng thử lại sau.'
            });
          }
          this.isSearching = false;
        }
      });
  }
  
  // Add new membership
  addNewMembership(): void {
    if (!this.validateMembershipData(this.newMembership)) {
      return;
    }
    
    this.isSubmitting = true;
    
    // Ensure total_spent is 0 for new members
    this.newMembership.total_spent = 0;
    
    // Create a DTO from the new membership
    const membershipDTO = new MembershipDTO({
      phone: this.newMembership.phone,
      total_spent: 0, // Always 0 for new members
      membership_tier: this.newMembership.membership_tier,
      discount_rate: this.newMembership.discount_rate
    });
    debugger
    this.membershipService.createMembership(membershipDTO)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          debugger
          // Add to memberships array with the ID from response
          if (response && response.id) {
            this.newMembership.id = response.id;
          } else {
            // If no ID in response, generate a temporary one
            const maxId = Math.max(...this.memberships.map(m => m.id), 0);
            this.newMembership.id = maxId + 1;
          }
          
          // Add to memberships array
          this.memberships.push({ ...this.newMembership });
          
          this.filterMemberships();
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm thành viên mới thành công!'
          });
          
          // Close the modal
          document.getElementById('addMembershipModal')?.classList.remove('show');
          this.isSubmitting = false;
          this.resetNewMembership();
        },
        error: (error) => {
          console.error('Error creating membership:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể thêm thành viên mới. Vui lòng thử lại sau.'
          });
          this.isSubmitting = false;
        }
      });
  }
}
