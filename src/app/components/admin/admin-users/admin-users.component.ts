import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../service/user.service';
import { User } from '../../../model/user';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  standalone: false,
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
  providers: [MessageService]
})
export class AdminUsersComponent implements OnInit {
  // Variables for search and filtering
  searchTerm: string = '';
  roleFilter: string = 'all';
  
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
  selectedUser: any = null;
  newUser: any = {
    full_name: '',
    phone: '',
    email: '',
    password: '',
    retype_password: '',
    address: '',
    date_of_birth: '',
    role_id: { id: 3, role_name: 'user' } // Default role is user
  };
  
  // Error message variables
  fullnameError: string = '';
  phoneError: string = '';
  emailError: string = '';
  passwordError: string = '';
  retype_passwordError: string = '';
  addressError: string = '';
  dobError: string = '';
  roleError: string = '';
  
  // New user error message variables
  newUserFullnameError: string = '';
  newUserPhoneError: string = '';
  newUserEmailError: string = '';
  newUserPasswordError: string = '';
  newUserRetypePasswordError: string = '';
  newUserAddressError: string = '';
  newUserDobError: string = '';
  newUserRoleError: string = '';
  
  // User data
  users: User[] = [];
  filteredUsers: User[] = [];
  
  // Password visibility toggles
  showNewPassword = false;
  showNewRetypePassword = false;
  showEditPassword = false;
  showEditRetypePassword = false;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private messageService: MessageService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers(this.searchTerm, this.currentPage - 1, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.users) {
            this.users = response.users;
            this.totalItems = response.totalItems || this.users.length;
            this.totalPages = response.totalPages || Math.ceil(this.totalItems / this.pageSize);
          } else {
            this.users = response;
            this.totalItems = this.users.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          }
          this.filterUsers();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching users:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải dữ liệu người dùng. Vui lòng thử lại sau.'
          });
          this.isLoading = false;
        }
      });
  }
  
  // Search functionality
  onSearch(): void {
    this.currentPage = 1;
    this.loadUsers();
  }
  
  // Filter by role
  setRoleFilter(role: string): void {
    this.roleFilter = role;
    this.filterUsers();
  }
  
  // Reset all filters
  resetFilters(): void {
    this.searchTerm = '';
    this.roleFilter = 'all';
    this.currentPage = 1;
    this.loadUsers();
  }
  
  // Filter users based on search term and role
  filterUsers(): void {
    let filtered = [...this.users];
    
    // Filter by role if not 'all'
    if (this.roleFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (user.role_id && user.role_id.role_name) {
          return user.role_id.role_name.toLowerCase() === this.roleFilter.toLowerCase();
        }
        return false;
      });
    }
    
    // Sort the filtered results
    this.sortUsers(filtered);
    
    this.filteredUsers = filtered;
    this.totalItems = this.filteredUsers.length;
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
    
    this.sortUsers(this.filteredUsers);
  }
  
  // Sort users array
  sortUsers(usersArray: User[]): void {
    usersArray.sort((a, b) => {
      let aValue: any, bValue: any;
      
      // Handle nested properties
      if (this.sortField === 'full_name') {
        aValue = a.full_name;
        bValue = b.full_name;
      } else if (this.sortField.includes('.')) {
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
    this.loadUsers();
  }
  
  getCurrentPageItems(): User[] {
    return this.filteredUsers;
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
      // Show limited pages with current page in the middle when possible
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
  
  // Modal functions
  openAddModal(): void {
    // Reset the new user object
    this.newUser = {
      full_name: '',
      phone: '',
      email: '',
      password: '',
      retype_password: '',
      address: '',
      date_of_birth: '',
      role_id: { id: 3, role_name: 'user' }
    };
    
    // Reset error messages
    this.resetNewUserErrors();
    
    // Open the modal
    const modal = document.getElementById('addUserModal');
    if (modal) {
      modal.classList.add('show');
    }
  }
  
  openEditModal(user: User): void {
    // Clone the user to avoid direct reference
    this.selectedUser = {...user};
     // Make sure date is properly formatted for the date input
     if (this.selectedUser.date_of_birth) {
      // Make sure it's a Date object
      const date = new Date(this.selectedUser.date_of_birth);
      if (!isNaN(date.getTime())) {
        // Format date to YYYY-MM-DD for input type="date"
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        this.selectedUser.date_of_birth = `${year}-${month}-${day}`;
      }
    }
    // Reset error messages
    this.resetEditErrors();
    
    // Open the modal
    const modal = document.getElementById('editUserModal');
    if (modal) {
      modal.classList.add('show');
    }
  }
  
  confirmDeleteUser(userId: number, event: Event): void {
    // Prevent row click event
    event.stopPropagation();
    
    // Store the id for deletion
    this.selectedUser = { id: userId };
    
    // Open the confirmation modal
    const modal = document.getElementById('confirmDeleteModal');
    if (modal) {
      modal.classList.add('show');
    }
  }
  
  // Button actions (stubs for UI demonstration)
  addNewUser(): void {
    // Reset error messages
    this.resetNewUserErrors();
    
    // Validate form inputs
    let isValid = true;
    
    // Validate full name
    if (!this.newUser.full_name || this.newUser.full_name.trim().length === 0) {
      this.newUserFullnameError = 'Họ tên không được để trống';
      isValid = false;
    } else if (this.newUser.full_name.length > 100) {
      this.newUserFullnameError = 'Họ tên không được vượt quá 100 ký tự';
      isValid = false;
    }
    
    // Validate phone number
    const phoneRegex = /^(0|84|\+84)(\d{9})$/;
    if (!this.newUser.phone || this.newUser.phone.trim().length === 0) {
      this.newUserPhoneError = 'Số điện thoại không được để trống';
      isValid = false;
    } else if (!phoneRegex.test(this.newUser.phone)) {
      this.newUserPhoneError = 'Số điện thoại không hợp lệ (phải bắt đầu với 0, 84, hoặc +84 và có 10 chữ số)';
      isValid = false;
    }
    
    // Validate email
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!this.newUser.email || this.newUser.email.trim().length === 0) {
      this.newUserEmailError = 'Email không được để trống';
      isValid = false;
    } else if (!emailRegex.test(this.newUser.email)) {
      this.newUserEmailError = 'Email không hợp lệ';
      isValid = false;
    }
    
    // Validate password
    if (!this.newUser.password || this.newUser.password.trim().length === 0) {
      this.newUserPasswordError = 'Mật khẩu không được để trống';
      isValid = false;
    } else if (this.newUser.password.length < 6) {
      this.newUserPasswordError = 'Mật khẩu phải có ít nhất 6 ký tự';
      isValid = false;
    }
    
    // Validate retype password
    if (!this.newUser.retype_password || this.newUser.retype_password.trim().length === 0) {
      this.newUserRetypePasswordError = 'Vui lòng nhập lại mật khẩu';
      isValid = false;
    } else if (this.newUser.password !== this.newUser.retype_password) {
      this.newUserRetypePasswordError = 'Mật khẩu nhập lại không khớp';
      isValid = false;
    }
    
    // Validate date of birth (optional but must be valid if provided)
    if (this.newUser.date_of_birth) {
      const dob = new Date(this.newUser.date_of_birth);
      const today = new Date();
      if (isNaN(dob.getTime())) {
        this.newUserDobError = 'Ngày sinh không hợp lệ';
        isValid = false;
      } else if (dob > today) {
        this.newUserDobError = 'Ngày sinh không thể là ngày trong tương lai';
        isValid = false;
      }
    }
    
    // Proceed if valid
    if (isValid) {
      this.isSubmitting = true;
      
      // Map role id from name
      let roleId = 1; // Default to user role (id 3)
      if (this.newUser.role_id.role_name === 'staff') {
        roleId = 3;
      } else if (this.newUser.role_id.role_name === 'user') {
        roleId = 2;
      }
      
      // Prepare data for API call
      const userAdminDTO = {
        phone: this.newUser.phone,
        full_name: this.newUser.full_name,
        email: this.newUser.email,
        password: this.newUser.password,
        retype_password: this.newUser.retype_password,
        address: this.newUser.address || '',
        date_of_birth: this.newUser.date_of_birth || null,
        role_id: roleId
      };
      
      // Call API service
      this.userService.registerUserAdmin(userAdminDTO)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.isSubmitting = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Đã thêm người dùng mới thành công'
            });
            
            // Close the modal
            const modal = document.getElementById('addUserModal');
            if (modal) {
              modal.classList.remove('show');
            }
            
            // Refresh the user list
            this.loadUsers();
          },
          error: (error: any) => {
            this.isSubmitting = false;
            console.error('Error adding user:', error);
            
            // Handle specific error cases
            if (error.error && error.error.message) {
              if (error.error.message.includes('Phone')) {
                this.newUserPhoneError = 'Số điện thoại đã tồn tại trong hệ thống';
              } else if (error.error.message.includes('Email')) {
                this.newUserEmailError = 'Email đã tồn tại trong hệ thống';
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Lỗi',
                  detail: error.error.message || 'Không thể thêm người dùng. Vui lòng thử lại sau.'
                });
              }
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể thêm người dùng. Vui lòng thử lại sau.'
              });
            }
          }
        });
    }
  }
  
  updateUser(): void {
    // Reset error messages
    this.resetEditErrors();
    
    // Validate form inputs
    let isValid = true;
    
    // Validate full name
    if (!this.selectedUser.full_name || this.selectedUser.full_name.trim().length === 0) {
      this.fullnameError = 'Họ tên không được để trống';
      isValid = false;
    } else if (this.selectedUser.full_name.length > 100) {
      this.fullnameError = 'Họ tên không được vượt quá 100 ký tự';
      isValid = false;
    }
    
    // Validate phone number
    const phoneRegex = /^(0|84|\+84)(\d{9})$/;
    if (!this.selectedUser.phone || this.selectedUser.phone.trim().length === 0) {
      this.phoneError = 'Số điện thoại không được để trống';
      isValid = false;
    } else if (!phoneRegex.test(this.selectedUser.phone)) {
      this.phoneError = 'Số điện thoại không hợp lệ (phải bắt đầu với 0, 84, hoặc +84 và có 10 chữ số)';
      isValid = false;
    }
    
    // Validate email
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!this.selectedUser.email || this.selectedUser.email.trim().length === 0) {
      this.emailError = 'Email không được để trống';
      isValid = false;
    } else if (!emailRegex.test(this.selectedUser.email)) {
      this.emailError = 'Email không hợp lệ';
      isValid = false;
    }
    
    // Validate password match if provided
    if (this.selectedUser.password || this.selectedUser.retype_password) {
      if (!this.selectedUser.password) {
        this.passwordError = 'Mật khẩu không được để trống khi muốn đổi mật khẩu';
        isValid = false;
      } else if (this.selectedUser.password.length < 6) {
        this.passwordError = 'Mật khẩu phải có ít nhất 6 ký tự';
        isValid = false;
      }
      
      if (!this.selectedUser.retype_password) {
        this.retype_passwordError = 'Vui lòng nhập lại mật khẩu';
        isValid = false;
      } else if (this.selectedUser.password !== this.selectedUser.retype_password) {
        this.retype_passwordError = 'Mật khẩu nhập lại không khớp';
        isValid = false;
      }
    }
    
    // Validate date of birth (optional but must be valid if provided)
    if (this.selectedUser.date_of_birth) {
      const dob = new Date(this.selectedUser.date_of_birth);
      const today = new Date();
      if (isNaN(dob.getTime())) {
        this.dobError = 'Ngày sinh không hợp lệ';
        isValid = false;
      } else if (dob > today) {
        this.dobError = 'Ngày sinh không thể là ngày trong tương lai';
        isValid = false;
      }
    }
    
    // Proceed if valid
    if (isValid) {
      this.isSubmitting = true;
      debugger
      // Map role id from name if it exists as an object
      let roleId;
      if (this.selectedUser.role_id && typeof this.selectedUser.role_id === 'object') {
        if (this.selectedUser.role_id.role_name === 'admin') {
          roleId = 1;
        } else if (this.selectedUser.role_id.role_name === 'staff') {
          roleId = 3;
        } else {
          roleId = 2; // Default to user role
        }
      } else if (typeof this.selectedUser.role_id === 'string') {
        // Handle case where role_id might be a string directly from select
        if (this.selectedUser.role_id === 'admin') {
          roleId = 1;
        } else if (this.selectedUser.role_id === 'staff') {
          roleId = 3;
        } else {
          roleId = 2; // Default to user role
        }
      } else {
        // Keep existing role id if it's a number already
        roleId = this.selectedUser.role_id || 3;
      }
      
      // Prepare data for API call
      const updateUserDTO = {
        id: this.selectedUser.id,
        phone: this.selectedUser.phone,
        full_name: this.selectedUser.full_name,
        email: this.selectedUser.email,
        password: this.selectedUser.password || null,
        address: this.selectedUser.address || '',
        date_of_birth: this.selectedUser.date_of_birth || null,
        role_id: roleId
      };
      
      // Call API service
      this.userService.updateUser(updateUserDTO)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            debugger
            this.isSubmitting = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Đã cập nhật thông tin người dùng thành công'
            });
            
            // Close the modal
            const modal = document.getElementById('editUserModal');
            if (modal) {
              modal.classList.remove('show');
            }
            
            // Refresh the user list
            this.loadUsers();
          },
          error: (error: any) => {
            this.isSubmitting = false;
            console.error('Error updating user:', error);
            
            // Handle specific error cases
            if (error.error && error.error.message) {
              if (error.error.message.includes('Phone')) {
                this.phoneError = 'Số điện thoại đã tồn tại trong hệ thống';
              } else if (error.error.message.includes('Email')) {
                this.emailError = 'Email đã tồn tại trong hệ thống';
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Lỗi',
                  detail: error.error.message || 'Không thể cập nhật thông tin người dùng. Vui lòng thử lại sau.'
                });
              }
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể cập nhật thông tin người dùng. Vui lòng thử lại sau.'
              });
            }
          }
        });
    }
  }
  
  proceedDelete(): void {
    if (!this.selectedUser || !this.selectedUser.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xác định người dùng cần xóa'
      });
      return;
    }
    
    this.isDeleting = true;
    
    this.userService.deleteUser(this.selectedUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isDeleting = false;
          
          // Add success message
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã xóa người dùng thành công'
          });
          
          // Close the modal
          this.cancelDelete();
          
          // Refresh the user list
          this.loadUsers();
          this.selectedUser = null;
        },
        error: (error: any) => {
          this.isDeleting = false;
          console.error('Error deleting user:', error);
          
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.error?.message || 'Không thể xóa người dùng. Vui lòng thử lại sau.'
          });
        }
      });
  }
  
  cancelDelete(): void {
    const modal = document.getElementById('confirmDeleteModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }
  
  // Reset error messages
  resetEditErrors(): void {
    this.fullnameError = '';
    this.phoneError = '';
    this.emailError = '';
    this.passwordError = '';
    this.retype_passwordError = '';
    this.addressError = '';
    this.dobError = '';
    this.roleError = '';
  }
  
  resetNewUserErrors(): void {
    this.newUserFullnameError = '';
    this.newUserPhoneError = '';
    this.newUserEmailError = '';
    this.newUserPasswordError = '';
    this.newUserRetypePasswordError = '';
    this.newUserAddressError = '';
    this.newUserDobError = '';
    this.newUserRoleError = '';
  }

  // Password visibility toggle methods
  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleNewRetypePasswordVisibility(): void {
    this.showNewRetypePassword = !this.showNewRetypePassword;
  }

  toggleEditPasswordVisibility(): void {
    this.showEditPassword = !this.showEditPassword;
  }

  toggleEditRetypePasswordVisibility(): void {
    this.showEditRetypePassword = !this.showEditRetypePassword;
  }

  // Helper method to format date in dd/MM/yyyy format
  formatDate(date: string | Date): string {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
}
