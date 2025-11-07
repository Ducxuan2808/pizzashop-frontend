import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableBookingService } from '../../../service/tablebooking.service';
import { TableBooking } from '../../../model/tablebooking';
import { TableBookingDTO } from '../../../dtos/tablebooking.dto';

@Component({
  selector: 'app-admin-tablebooking',
  standalone: false,
  templateUrl: './admin-tablebooking.component.html',
  styleUrl: './admin-tablebooking.component.scss',
  providers: [MessageService]
})
export class AdminTablebookingComponent implements OnInit {
  searchTerm: string = '';
  statusFilter: string = 'all';
  
  // Date range filter
  startDate: string = '';
  endDate: string = '';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  
  // Delete confirmation
  showDeleteConfirm: boolean = false;
  bookingIdToDelete: number | null = null;
  
  // Edit confirmation
  showEditConfirm: boolean = false;
  editConfirmBookingDTO: TableBookingDTO | null = null;
  
  // Edit modal
  isEditModalOpen: boolean = false;
  bookingIdToEdit: number | null = null;
  editBookingForm: FormGroup;
  
  // Add modal
  isAddModalOpen: boolean = false;
  addBookingForm: FormGroup;
  
  // Loading state
  isSubmitting: boolean = false;
  isLoading: boolean = false;
  
  // Math property để sử dụng trong template
  Math = Math;
  
  // Properties for booking list and filtering
  bookings: TableBooking[] = [];
  filteredBookings: TableBooking[] = [];
  
  isDetailModalOpen: boolean = false;
  selectedBooking: TableBooking | null = null;

  // Sorting
  sortField: string = 'id';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(
    private messageService: MessageService,
    private fb: FormBuilder,
    private tableBookingService: TableBookingService
  ) {
    this.editBookingForm = this.createBookingForm();
    this.addBookingForm = this.createBookingForm();
  }

  ngOnInit(): void {
    this.loadTableBookings();
    this.setDefaultDates();
  }

  loadTableBookings(): void {
    this.isLoading = true;
    this.tableBookingService.getTableBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading table bookings:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách đặt bàn'
        });
        this.isLoading = false;
      }
    });
  }
  
  createBookingForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      table_number: [null, [Validators.required, Validators.min(1)]],
      number_of_people: [null, [Validators.required, Validators.min(1)]],
      booking_time: [null, [Validators.required]],
      status: ['Reserved', [Validators.required]],
      note: [''],
      is_active: [true]
    });
  }

  onSearch() {
    // Implement search functionality here
    this.messageService.add({
      severity: 'info',
      summary: 'Thông báo',
      detail: 'Đã tìm kiếm với từ khóa: ' + this.searchTerm
    });
    
    this.applyFilters();
  }

  setStatusFilter(status: string) {
    this.statusFilter = status;
    // Apply filter here
    this.messageService.add({
      severity: 'info',
      summary: 'Thông báo',
      detail: 'Đã lọc theo trạng thái: ' + status
    });
    
    this.applyFilters();
  }

  // Pagination methods
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }
  
  getPageNumbers(): number[] {
    const pageNumbers: number[] = [];
    const maxPages = 5; // Maximum number of page buttons to show
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = startPage + maxPages - 1;
    
    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  }
  
  // Sorting
  sort(field: string) {
    if (this.sortField === field) {
      // If already sorting by this field, toggle direction
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // If sorting by a new field, default to ascending
      this.sortField = field;
      this.sortOrder = 'asc';
    }
    
    this.applyFilters();
  }
  
  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'pi pi-sort';
    }
    
    return this.sortOrder === 'asc' ? 'pi pi-sort-up' : 'pi pi-sort-down';
  }
  
  // CRUD Operations  
  // Add new booking
  submitAddBooking() {
    debugger;
    if (this.addBookingForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    
    // Create the DTO object from form values
    const bookingDTO: TableBookingDTO = {
      user_id: 1, // Default user ID if no user is selected
      name: this.addBookingForm.value.name,
      phone: this.addBookingForm.value.phone,
      table_number: this.addBookingForm.value.table_number,
      number_of_people: this.addBookingForm.value.number_of_people,
      booking_time: new Date(this.addBookingForm.value.booking_time),
      status: this.addBookingForm.value.status,
      note: this.addBookingForm.value.note || '',
      is_active: this.addBookingForm.value.is_active || true
    };
    
    // Format date for Java compatibility
    const submittingDTO = { ...bookingDTO };
    
    // Convert Date to ISO format for Java compatibility
    if (submittingDTO.booking_time instanceof Date) {
      // Format: yyyy-MM-ddTHH:mm:ss.SSSZ
      const date = submittingDTO.booking_time;
      // Make a proper ISO string and then format it for Java
      submittingDTO.booking_time = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
        .toISOString().replace('Z', '+0000');
    }
    
    // Call service to create booking
    this.tableBookingService.createTableBooking(submittingDTO).subscribe({
      next: (response) => {
        debugger;
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã thêm đặt bàn mới'
        });
        
        // Reload the table data
        this.loadTableBookings();
        
        this.isSubmitting = false;
        this.closeAddModal();
      },
      error: (error) => {
        console.error('Error creating booking:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể thêm đặt bàn. Vui lòng thử lại sau.'
        });
        this.isSubmitting = false;
      }
    });
  }
  
  // Edit booking
  editBooking(id: number) {
    debugger;
    this.bookingIdToEdit = id;
    const bookingToEdit = this.filteredBookings.find(b => b.id === id);
    
    if (bookingToEdit) {
      // Create a date object from the booking time string
      const bookingTime = bookingToEdit.booking_time instanceof Date ? 
        bookingToEdit.booking_time : new Date(bookingToEdit.booking_time);
        
      this.editBookingForm.patchValue({
        name: bookingToEdit.name,
        phone: bookingToEdit.phone,
        table_number: bookingToEdit.table_number,
        number_of_people: bookingToEdit.number_of_people,
        booking_time: this.formatDateForInput(bookingTime),
        status: bookingToEdit.status,
        note: bookingToEdit.note,
        is_active: true
      });
      
      this.isEditModalOpen = true;
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy đặt bàn'
      });
    }
  }
  
  submitEditBooking() {
    debugger;
    if (this.editBookingForm.invalid || this.bookingIdToEdit === null) {
      return;
    }
    
    // Create the DTO object from form values
    const bookingDTO: TableBookingDTO = {
      user_id: this.bookings.find(b => b.id === this.bookingIdToEdit)?.user_id || 1,
      name: this.editBookingForm.value.name,
      phone: this.editBookingForm.value.phone,
      table_number: this.editBookingForm.value.table_number,
      number_of_people: this.editBookingForm.value.number_of_people,
      booking_time: new Date(this.editBookingForm.value.booking_time),
      status: this.editBookingForm.value.status,
      note: this.editBookingForm.value.note || '',
      is_active: this.editBookingForm.value.is_active || true
    };
    
    this.isSubmitting = true;
    
    // Format date for Java compatibility
    const submittingDTO = { ...bookingDTO };
    
    // Convert Date to ISO format for Java compatibility
    if (submittingDTO.booking_time instanceof Date) {
      // Format: yyyy-MM-ddTHH:mm:ss.SSSZ
      const date = submittingDTO.booking_time;
      // Make a proper ISO string and then format it for Java
      submittingDTO.booking_time = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
        .toISOString().replace('Z', '+0000');
    }
    
    // Call service to update
    this.tableBookingService.updateTableBooking(this.bookingIdToEdit, submittingDTO).subscribe({
      next: (updatedBooking) => {
        debugger;
        // Update local array
        const index = this.bookings.findIndex(b => b.id === this.bookingIdToEdit);
        if (index !== -1) {
          this.bookings[index] = updatedBooking;
          this.applyFilters();
        }
        
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã cập nhật đặt bàn'
        });
        
        this.isSubmitting = false;
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error updating booking:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể cập nhật đặt bàn. Vui lòng thử lại sau.'
        });
        this.isSubmitting = false;
      }
    });
  }
  
  hideEditConfirmModal(): void {
    this.showEditConfirm = false;
    this.editConfirmBookingDTO = null;
  }
  
  // Delete booking
  confirmDeleteBooking(id: number, event: Event) {
    event.stopPropagation();
    this.bookingIdToDelete = id;
    this.showDeleteConfirm = true;
  }
  
  proceedDelete() {
    if (this.bookingIdToDelete === null) {
      return;
    }
    
    // Here we would call service to delete
    // For demo, just remove from array
    const index = this.filteredBookings.findIndex(b => b.id === this.bookingIdToDelete);
    
    if (index !== -1) {
      this.filteredBookings.splice(index, 1);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã xóa đặt bàn'
      });
    }
    
    this.hideDeleteModal();
    this.applyFilters();
  }
  
  // Helper methods
  formatDateForInput(date: Date): string {
    // Format date to YYYY-MM-DDThh:mm format for datetime-local input
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    let hours = '' + d.getHours();
    let minutes = '' + d.getMinutes();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hours.length < 2) hours = '0' + hours;
    if (minutes.length < 2) minutes = '0' + minutes;

    return [year, month, day].join('-') + 'T' + [hours, minutes].join(':');
  }

  applyFilters(): void {
    let results = [...this.bookings];
    
    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      results = results.filter(booking => 
        booking.name.toLowerCase().includes(term) ||
        booking.phone.includes(term) ||
        booking.note.toLowerCase().includes(term)
      );
    }
    
    // Filter by status
    if (this.statusFilter !== 'all') {
      results = results.filter(booking => booking.status === this.statusFilter);
    }
    
    // Apply sorting
    results.sort((a, b) => {
      let aValue = a[this.sortField as keyof TableBooking];
      let bValue = b[this.sortField as keyof TableBooking];
      
      // Convert to strings for comparison if not already strings
      if (typeof aValue !== 'string') {
        aValue = String(aValue);
      }
      
      if (typeof bValue !== 'string') {
        bValue = String(bValue);
      }
      
      // For date fields, special handling
      if (this.sortField === 'booking_time') {
        aValue = new Date(a.booking_time).getTime();
        bValue = new Date(b.booking_time).getTime();
      }
      
      // For number fields, convert to numbers
      if (['id', 'table_number', 'number_of_people'].includes(this.sortField)) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      // Compare based on sort order
      if (this.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    this.filteredBookings = results;
    this.totalItems = this.filteredBookings.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    // Adjust current page if needed
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
  }

  getCurrentPageItems(): TableBooking[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.totalItems);
    return this.filteredBookings.slice(startIndex, endIndex);
  }

  openAddModal(): void {
    this.isAddModalOpen = true;
    this.addBookingForm.reset();
    
    // Set default values with proper date format
    const today = new Date();
    
    this.addBookingForm.patchValue({
      status: 'Reserved',
      is_active: true,
      booking_time: this.formatDateForInput(today)
    });
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  showDeleteModal(id: number): void {
    this.bookingIdToDelete = id;
    this.showDeleteConfirm = true;
  }

  hideDeleteModal(): void {
    this.showDeleteConfirm = false;
    this.bookingIdToDelete = null;
  }

  openEditModal(booking: TableBooking): void {
    debugger;
    this.bookingIdToEdit = booking.id;
    
    // Create a date object from the booking time string
    const bookingTime = booking.booking_time instanceof Date ? 
      booking.booking_time : new Date(booking.booking_time);
    
    this.editBookingForm.patchValue({
      name: booking.name,
      phone: booking.phone,
      table_number: booking.table_number,
      number_of_people: booking.number_of_people,
      booking_time: this.formatDateForInput(bookingTime),
      status: booking.status,
      note: booking.note,
      is_active: booking.is_active
    });
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.bookingIdToEdit = null;
  }

  openDetailModal(booking: TableBooking): void {
    this.selectedBooking = booking;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedBooking = null;
  }

  updateTableNumber(booking: TableBooking): void {
    if (booking.table_number < 1) {
      booking.table_number = 1;
    }
    this.updateBooking(booking);
  }

  updateNumberOfPeople(booking: TableBooking): void {
    if (booking.number_of_people < 1) {
      booking.number_of_people = 1;
    }
    this.updateBooking(booking);
  }

  updateStatus(booking: TableBooking): void {
    this.updateBooking(booking);
  }

  private updateBooking(booking: TableBooking): void {
    this.isSubmitting = true;
    // Here you would call your service to update the booking
    // For now, we'll just update the local data
    const index = this.bookings.findIndex(b => b.id === booking.id);
    if (index !== -1) {
      this.bookings[index] = { ...booking };
      this.applyFilters();
    }
    this.isSubmitting = false;
  }

  setDefaultDates(): void {
    const today = new Date();
    this.startDate = this.formatDateForInput(today);
    this.endDate = this.formatDateForInput(today);
  }

  onDateChange(): void {
    // Validate date range
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      
      if (start > end) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Ngày bắt đầu không được lớn hơn ngày kết thúc'
        });
        this.endDate = this.startDate;
      }
    }
  }

  searchByDate(): void {
    if (!this.startDate || !this.endDate) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng chọn khoảng thời gian'
      });
      return;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    end.setHours(23, 59, 59, 999); // Set to end of day

    this.filteredBookings = this.bookings.filter(booking => {
      const bookingDate = new Date(booking.booking_time);
      return bookingDate >= start && bookingDate <= end;
    });

    this.totalItems = this.filteredBookings.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.currentPage = 1;
  }

  filterBookingsForToday(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // End of today
    
    this.filteredBookings = this.bookings.filter(booking => {
      const bookingDate = new Date(booking.booking_time);
      bookingDate.setHours(0, 0, 0, 0); // Reset time part for comparison
      
      return bookingDate.getTime() === today.getTime();
    });
    
    this.totalItems = this.filteredBookings.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.currentPage = 1;
    
    // Show notification
    this.messageService.add({
      severity: 'info',
      summary: 'Lọc',
      detail: `Đang hiển thị ${this.filteredBookings.length} đơn đặt bàn hôm nay`
    });
  }
  
  resetFilters(): void {
    this.statusFilter = 'all';
    this.searchTerm = '';
    this.applyFilters();
    
    // Show notification
    this.messageService.add({
      severity: 'info',
      summary: 'Lọc',
      detail: 'Đã hiển thị tất cả đơn đặt bàn'
    });
  }

  // Update directly from table
  updateDirectFromRow(booking: TableBooking): void {
    debugger;
    this.bookingIdToEdit = booking.id;
    
    // Create the DTO object directly from the booking
    const bookingDTO: TableBookingDTO = {
      user_id: 1,
      name: booking.name,
      phone: booking.phone,
      table_number: booking.table_number,
      number_of_people: booking.number_of_people,
      booking_time: booking.booking_time,
      status: booking.status,
      note: booking.note || '',
      is_active: true
    };
    
    this.isSubmitting = true;
    
    // Format date for Java compatibility
    const submittingDTO = { ...bookingDTO };
    
    // Convert Date to ISO format for Java compatibility
    if (submittingDTO.booking_time instanceof Date) {
      // Format: yyyy-MM-ddTHH:mm:ss.SSSZ
      const date = submittingDTO.booking_time;
      // Make a proper ISO string and then format it for Java
      submittingDTO.booking_time = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
        .toISOString().replace('Z', '+0000');
    }
    
    // Call service to update
    this.tableBookingService.updateTableBooking(this.bookingIdToEdit, submittingDTO).subscribe({
      next: (updatedBooking) => {
        // Update local array
        const index = this.bookings.findIndex(b => b.id === this.bookingIdToEdit);
        if (index !== -1) {
          this.bookings[index] = updatedBooking;
          this.applyFilters();
        }
        
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã cập nhật đặt bàn'
        });
        
        this.isSubmitting = false;
        this.bookingIdToEdit = null;
      },
      error: (error) => {
        console.error('Error updating booking:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể cập nhật đặt bàn. Vui lòng thử lại sau.'
        });
        this.isSubmitting = false;
        this.bookingIdToEdit = null;
      }
    });
  }
}
