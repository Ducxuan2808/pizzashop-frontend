import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';
import { OrderService } from '../../../service/order.service';
import { OrderResponse } from '../../../responses/order/order.response';
import { MessageService, ConfirmationService } from 'primeng/api';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { OrderDTO } from '../../../dtos/order/order.dto';
import { PizzaService } from '../../../service/pizza.service';
import { SizeService } from '../../../service/size.service';
import { BaseTypeService } from '../../../service/base-type.service';
import { Pizza } from '../../../model/pizza';
import { Size } from '../../../model/size';
import { Type } from '../../../model/type';
import { MembershipService } from '../../../service/membership.service';
import { Membership } from '../../../model/membership';
import { fromEvent } from 'rxjs';

interface Order {
  id: number;
  orderDate: string;
  customer: string;
  email: string;
  phone: string;
  total: number;
  status: 'Pending' | 'Preparing' | 'Delivering' | 'Completed' | 'Cancelled';
  payment: 'paid' | 'unpaid';
  address: string;
  items: OrderItem[];
  note?: string;
  paymentMethod?: string;
  discountAmount?: number;
  shippingFee?: number;
  tableNumber?: number;
  shippingTime?: string;
  orderType?: 'Online' | 'Dine-in' | 'Takeaway';
}

interface OrderItem {
  id: number;
  pizzaId?: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  size?: any;
  baseType?: any;
  thumbnail?: string;
  itemNote?: string;
}

// Thêm interface mới để lưu nhãn hiển thị tiếng Việt
interface StatusLabel {
  [key: string]: string;
}

interface PaymentLabel {
  [key: string]: string;
}

// Add interfaces for dropdown data


@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class OrdersComponent implements OnInit, OnDestroy {
  // Properties for data
  allOrders: Order[] = [];
  filteredOrders: Order[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  paymentFilter: string = 'all';
  orderTypeFilter: string = 'all';
  isUrgentFilter: boolean = false;
  isPendingFilter: boolean = false;
  selectedOrder: Order | null = null;
  isLoading: boolean = false;
  
  // Sorting properties
  sortColumn: string = 'shippingTime';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalPages: number = 1;

  // Row highlight and selection properties
  highlightedRow: number | null = null;
  selectedRow: number | null = null;

  // Admin header properties
  activeMenu: string = 'orders';
  sidebarVisible: boolean = true;

  // Display options
  isDetailModalOpen: boolean = false;
  isEditModalOpen: boolean = false;
  orderToEdit: number | null = null;
  showDeleteConfirm: boolean = false;
  orderIdToDelete: number | null = null;
  
  // Form properties
  editOrderForm: FormGroup;
  isSubmitting: boolean = false;

  // Thêm các biến lưu nhãn tiếng Việt
  statusLabels: StatusLabel = {
    'pending': 'Chờ xử lý',
    'preparing': 'Đang chuẩn bị',
    'delivering': 'Đang giao hàng',
    'completed': 'Đã giao hàng',
    'cancelled': 'Đã hủy'
  };

  paymentLabels: PaymentLabel = {
    'paid': 'Đã thanh toán',
    'unpaid': 'Chưa thanh toán'
  };

  paymentMethodLabels: PaymentLabel = {
    'vnpay': 'VNPay',
    'momo': 'Ví MoMo',
    'cash': 'Tiền mặt'
  };

  private destroy$ = new Subject<void>();

  // Add Order Modal properties
  isAddModalOpen: boolean = false;
  addOrderForm: FormGroup;
  availableProducts: Pizza[] = [];
  availableSizes: Size[] = [];
  availableBases: Type[] = [];

  // Member order properties
  isMemberOrder: boolean = false;
  memberPhoneSearch: string = '';
  isSearchingMember: boolean = false;
  selectedMember: any = null;
  memberNotFound: boolean = false;
  memberTotalSpent: number = 0;
  useSamePhone: boolean = true; // Default to using same phone for delivery and order

  constructor(
    private router: Router, 
    private titleService: Title,
    private orderService: OrderService,
    private pizzaService: PizzaService,
    private sizeService: SizeService,
    private baseTypeService: BaseTypeService,
    private formBuilder: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private membershipService: MembershipService
  ) { 
    // Initialize the edit order form
    this.editOrderForm = this.formBuilder.group({
      customer: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
      email: ['', [Validators.email]],
      address: ['', Validators.required],
      status: ['', Validators.required],
      paymentMethod: ['', Validators.required],
      shippingFee: [0, [Validators.min(0)]],
      discountAmount: [0, [Validators.min(0)]],
      tableNumber: [0, [Validators.min(0)]],
      shippingTime: [''],
      orderType: ['Online', Validators.required],
      note: ['']
    });

    // Initialize the add order form
    this.addOrderForm = this.formBuilder.group({
      customer: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
      phoneOrder: ['', [Validators.pattern(/^\d{10,11}$/)]],
      email: ['', [Validators.email]],
      address: [''], // Address is now optional, no Validators.required
      orderType: ['Online', Validators.required],
      paymentMethod: ['cash', Validators.required],
      shippingFee: [0, [Validators.min(0)]], // Default to 0
      discountAmount: [0, [Validators.min(0)]],
      tableNumber: [0, [Validators.min(0)]],
      shippingTime: [this.formatDateTimeForInput(new Date(new Date().getTime() + 30 * 60000))], // 30 minutes from now
      orderTime: [this.formatDateTimeForInput(new Date())],
      note: [''],
      cartItems: this.formBuilder.array([])
    });
    
    // Set shipping fee based on order type (initialize with Online, so set to 30000)
    this.addOrderForm.get('shippingFee')?.setValue(30000);
    
    // Listen for changes to orderType to update shipping fee
    this.addOrderForm.get('orderType')?.valueChanges.subscribe(orderType => {
      const shippingFeeControl = this.addOrderForm.get('shippingFee');
      if (orderType === 'Online') {
        shippingFeeControl?.setValue(30000);
      } else {
        shippingFeeControl?.setValue(0);
      }
      
      // Update total price when shipping fee changes
      this.updateTotalPrice();
    });
  }

  ngOnInit(): void {
    // Set title
    this.titleService.setTitle('Quản lý đơn hàng - PizZing Admin');
    
    // Load orders on component init
    this.loadOrders();
    
    // Load products, sizes, and bases for dropdowns
    this.loadProductData();
    
    // Check screen size on init
    this.checkScreenSize();
    
    // Set up window resize listener
    fromEvent(window, 'resize')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkScreenSize();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Admin header methods
  setActiveMenu(menu: string): void {
    this.activeMenu = menu;
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
    const body = document.querySelector('body');
    if (body) {
      if (this.sidebarVisible) {
        body.classList.remove('sidebar-icon-only');
      } else {
        body.classList.add('sidebar-icon-only');
      }
    }
  }

  private checkScreenSize(): void {
    const width = window.innerWidth;
    if (width < 992) {
      this.sidebarVisible = false;
    } else {
      this.sidebarVisible = true;
    }
  }

  // Row highlight and selection methods
  highlightRow(index: number): void {
    this.highlightedRow = index;
  }

  unhighlightRow(): void {
    // Only remove highlight if not selected
    if (this.highlightedRow !== this.selectedRow) {
      this.highlightedRow = null;
    }
  }

  selectRow(index: number): void {
    // Toggle selection if clicking the same row
    if (this.selectedRow === index) {
      this.selectedRow = null;
    } else {
      this.selectedRow = index;
      console.log('Selected order:', this.filteredOrders[index]);
    }
  }

  // Phương thức để toggle hiển thị chi tiết đơn hàng
  toggleOrderDetails(order: Order, index: number): void {
    if (this.selectedRow === index) {
      this.selectedRow = null;
    } else {
      this.selectedRow = index;
    }
  }

  // Data loading method
  loadOrders(): void {
    this.isLoading = true;
    this.orderService.getAllOrders(this.searchTerm, 0, 999999) // Lấy tất cả đơn hàng
      .subscribe({
        next: (response: any) => {
          // Khởi tạo mảng để lưu trữ các đơn hàng đã chuyển đổi
          const convertedOrders: Order[] = [];
          
          // Kiểm tra xem response có orders không
          if (response && response.orders) {
            // Chuyển đổi từng OrderResponse thành Order
            response.orders.forEach((orderResponse: any) => {
              // Tạo đối tượng OrderItem từ order_details
              const orderItems: OrderItem[] = [];
              
              if (orderResponse.order_details) {
                orderResponse.order_details.forEach((detail: any) => {
                  const item: OrderItem = {
                    id: detail.id,
                    pizzaId: detail.pizza?.id,
                    name: detail.pizza?.name || 'Unknown Product',
                    price: detail.price,
                    quantity: detail.quantity,
                    subtotal: detail.price * detail.quantity,
                    size: detail.size || '',
                    baseType: detail.baseType || '',
                    thumbnail: detail.pizza?.thumbnail,
                    itemNote: detail.note
                  };
                  orderItems.push(item);
                });
              }
              
              // Map từ OrderResponse sang Order
              const order: Order = {
                id: orderResponse.id,
                orderDate: orderResponse.order_time ? new Date(orderResponse.order_time).toISOString() : '',
                customer: orderResponse.full_name || '',
                email: orderResponse.email || '',
                phone: orderResponse.delivery_phone || '',
                total: orderResponse.total_price || 0,
                status: this.mapStatus(orderResponse.status),
                payment: this.getPaymentStatus(orderResponse.payment_method, this.mapStatus(orderResponse.status)),
                paymentMethod: orderResponse.payment_method || '',
                address: orderResponse.delivery_address || '',
                note: orderResponse.note || '',
                items: orderItems,
                discountAmount: orderResponse.discount_amount || 0,
                shippingFee: orderResponse.shipping_fee || 30000,
                tableNumber: orderResponse.table_number || 0,
                shippingTime: orderResponse.shipping_time || '',
                orderType: orderResponse.order_type || 'Online'
              };
              
              convertedOrders.push(order);
            });
          }
          
          this.allOrders = convertedOrders;
          // Sắp xếp toàn bộ danh sách trước khi áp dụng bộ lọc
          this.sortData();
          // Áp dụng bộ lọc sau khi đã sắp xếp
          this.applyFilters();
          
          // Tính toán tổng số trang dựa trên số lượng đơn hàng đã lọc
          this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.isLoading = false;
          
          // Nếu có lỗi, hiển thị mảng rỗng
          this.allOrders = [];
          this.filteredOrders = [];
          this.totalPages = 0;
        }
      });
  }
  
  // Map status từ backend sang frontend
  mapStatus(status: string): 'Pending' | 'Preparing' | 'Delivering' | 'Completed' | 'Cancelled' {
    if (status === 'Pending' || status === 'Đang chờ xử lý') return 'Pending';
    if (status === 'Preparing' || status === 'Đang xử lý') return 'Preparing';
    if (status === 'Delivering' || status === 'Đang giao hàng') return 'Delivering';
    if (status === 'Completed' || status === 'Đã giao hàng') return 'Completed';
    if (status === 'Cancelled' || status === 'Đã hủy') return 'Cancelled';
    return 'Pending'; // Default case
  }

  // Search method
  searchOrders(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  // CRUD operations
  openAddOrderModal(): void {
    // Initialize form with default values
    this.resetAddOrderForm();
    
    // Set current time + 1 minute for order time with GMT+7 adjustment
    const now = new Date();
    // No need to adjust for GMT+7 as local time is already in the correct timezone
    const orderTime = new Date(now.getTime() + 60000); // current time + 1 minute
    
    this.addOrderForm.patchValue({
      orderTime: this.formatDateTimeForInput(orderTime),
      orderType: 'Online',
      shippingFee: 30000 // Default shipping fee for Online orders
    });
    
    // Make sure address validation is set correctly for the default order type
    this.updateAddressValidation();
    
    // Load available products, sizes, and bases
    this.loadProductData();
    
    // Open modal
    this.isAddModalOpen = true;
  }

  viewOrderDetails(id: number): void {
    // Find the order and show its details
    const order = this.allOrders.find(o => o.id === id);
    if (order) {
      this.showOrderDetails(order);
    }
  }

  editOrder(id: number): void {
    this.orderToEdit = id;
    this.isEditModalOpen = true;
    
    // Find the order to edit
    const orderToEdit = this.allOrders.find(order => order.id === id);
    if (orderToEdit) {
      // Format the shipping time for the datetime-local input
      let shippingTimeValue = '';
      if (orderToEdit.shippingTime) {
        const shippingTime = new Date(orderToEdit.shippingTime);
        shippingTimeValue = shippingTime.toISOString().slice(0, 16); // Format to YYYY-MM-DDTHH:MM
      }
      
      // Populate the form with order data
      this.editOrderForm.patchValue({
        customer: orderToEdit.customer,
        phone: orderToEdit.phone,
        email: orderToEdit.email,
        address: orderToEdit.address,
        status: orderToEdit.status,
        paymentMethod: orderToEdit.paymentMethod || 'cash',
        shippingFee: orderToEdit.shippingFee || 0,
        discountAmount: orderToEdit.discountAmount || 0,
        tableNumber: orderToEdit.tableNumber || 0,
        shippingTime: shippingTimeValue,
        note: orderToEdit.note || '',
        orderType: orderToEdit.orderType || 'Online'
      });
    }
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.orderToEdit = null;
    this.editOrderForm.reset();
  }

  submitEditOrder(): void {
    if (this.editOrderForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.editOrderForm.controls).forEach(key => {
        const control = this.editOrderForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    // Set submitting state
    this.isSubmitting = true;
    
    if (!this.orderToEdit) {
      this.isSubmitting = false;
      this.closeEditModal();
      return;
    }

    const formValue = this.editOrderForm.value;
    
    // Find the existing order to get items and other data
    const existingOrder = this.allOrders.find(order => order.id === this.orderToEdit);
    if (!existingOrder) {
      this.isSubmitting = false;
      this.closeEditModal();
      return;
    }
    
    // Prepare shipping time - convert from input format to Date
    const shippingTime = formValue.shippingTime ? new Date(formValue.shippingTime) : new Date();
    
    // Get user_id from localStorage (current admin user)
    const userJSON = localStorage.getItem('user');
    const currentUser = userJSON ? JSON.parse(userJSON) : null;
    
    // Create OrderDTO with all required fields
    const orderData = new OrderDTO({
      user_id: currentUser?.id ?? 1, // Use logged-in admin user ID from localStorage
      full_name: formValue.customer,
      order_type: formValue.orderType,
      email: formValue.email || '',
      delivery_phone: formValue.phone,
      phone_order: formValue.phoneOrder || formValue.phone, // Add phone_order field
      delivery_address: formValue.address,
      status: formValue.status,
      note: formValue.note || '',
      total_price: existingOrder.total,
      payment_method: formValue.paymentMethod,
      discount_amount: formValue.discountAmount?.toString() || '0',
      order_time: new Date(existingOrder.orderDate), // Keep original order time
      table_number: formValue.tableNumber || 0,
      shipping_time: formValue.shippingTime ? this.formatShippingTimeForBackend(formValue.shippingTime) : null,
      cart_items: [] // We're only updating order details, not items
    });
    
    // Call the service to update the order
    this.orderService.updateOrder(this.orderToEdit, orderData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        
        // Close the modal
        this.closeEditModal();
        
        // Show success message
        this.messageService.add({
          severity: 'success',
          summary: 'Cập nhật thành công',
          detail: `Đơn hàng #${this.orderToEdit} đã được cập nhật`,
          life: 5000
        });

        // Reload the entire page
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Delay 1 second to show the success message
      },
      error: (error) => {
        console.error('Error updating order:', error);
        this.isSubmitting = false;
        
        // Show error message
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi cập nhật đơn hàng',
          detail: 'Không thể cập nhật đơn hàng. Vui lòng kiểm tra kết nối và thử lại sau.',
          life: 5000
        });
      }
    });
  }

  // Helper method to update the local order data after form submission
  private updateLocalOrderData(): void {
    if (!this.orderToEdit) return;
    
    const formValue = this.editOrderForm.value;
    const orderIndex = this.allOrders.findIndex(order => order.id === this.orderToEdit);
    
    if (orderIndex !== -1) {
      // Create a new order object with updated values
      const updatedOrder = {
        ...this.allOrders[orderIndex],
        customer: formValue.customer,
        phone: formValue.phone,
        email: formValue.email,
        address: formValue.address,
        status: formValue.status,
        paymentMethod: formValue.paymentMethod,
        shippingFee: formValue.shippingFee,
        discountAmount: formValue.discountAmount,
        note: formValue.note,
        // Update payment status based on payment method and status
        payment: this.getPaymentStatus(formValue.paymentMethod, formValue.status),
        tableNumber: formValue.tableNumber,
        shippingTime: formValue.shippingTime,
        orderType: formValue.orderType
      };
      
      // Update the order in the array
      this.allOrders[orderIndex] = updatedOrder;
      
      // Apply filters to refresh the displayed orders
      this.applyFilters();
    }
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadOrders();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    // Show up to 5 page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Helper methods for styling
  getStatusClass(status: string): string {
    switch (status) {
      case 'delivered':
        return 'status-delivered';
      case 'processing':
        return 'status-shipping';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getPaymentClass(payment: string): string {
    switch (payment) {
      case 'paid':
        return 'payment-paid';
      case 'unpaid':
        return 'payment-unpaid';
      default:
        return '';
    }
  }

  // Filter methods
  applyFilters(): void {
    // Áp dụng các bộ lọc lên danh sách đã sắp xếp
    this.filteredOrders = this.allOrders.filter(order => {
      let matchesStatus = true;
      let matchesPayment = true;
      let matchesOrderType = true;
      let matchesUrgent = true;
      let matchesPending = true;

      // Apply status filter
      if (this.statusFilter !== 'all') {
        matchesStatus = order.status.toLowerCase() === this.statusFilter.toLowerCase();
      }

      // Apply payment filter
      if (this.paymentFilter !== 'all') {
        matchesPayment = order.payment.toLowerCase() === this.paymentFilter.toLowerCase();
      }

      // Apply order type filter
      if (this.orderTypeFilter !== 'all') {
        matchesOrderType = order.orderType?.toLowerCase() === this.orderTypeFilter.toLowerCase();
      }

      // Apply urgent filter (Cần xử lý ngay)
      if (this.isUrgentFilter) {
        if (!order.shippingTime) {
          matchesUrgent = false;
        } else {
          const shippingTime = new Date(order.shippingTime);
          const now = new Date();
          
          // Kiểm tra xem thời gian giao hàng có phải trong ngày không
          const isSameDay = shippingTime.getDate() === now.getDate() &&
                           shippingTime.getMonth() === now.getMonth() &&
                           shippingTime.getFullYear() === now.getFullYear();
          
          if (!isSameDay) {
            matchesUrgent = false;
          } else {
            // Tính số phút còn lại đến thời gian giao hàng
            const diffMinutes = (shippingTime.getTime() - now.getTime()) / (1000 * 60);
            
            // Đơn hàng cần xử lý ngay khi:
            // 1. Thời gian giao hàng còn dưới 60 phút
            // 2. Thời gian giao hàng phải lớn hơn thời gian hiện tại
            // 3. Đơn hàng chưa hoàn thành và chưa hủy
            matchesUrgent = diffMinutes <= 60 && 
                           diffMinutes > 0 && 
                           order.status !== 'Completed' && 
                           order.status !== 'Cancelled';
          }
        }
      }

      // Apply pending filter (Chưa xử lý)
      if (this.isPendingFilter) {
        const shippingTime = new Date(order.shippingTime || '');
        const now = new Date();
        
        matchesPending = shippingTime > now && 
                        order.status !== 'Completed' && 
                        order.status !== 'Cancelled' &&
                        order.status === 'Pending';
      }

      return matchesStatus && matchesPayment && matchesOrderType && matchesUrgent && matchesPending;
    });

    // Tính toán lại tổng số trang
    this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
    
    // Reset về trang đầu tiên khi áp dụng bộ lọc
    this.currentPage = 1;
  }

  filterUrgentOrders(): void {
    this.isUrgentFilter = !this.isUrgentFilter;
    if (this.isUrgentFilter) {
      this.isPendingFilter = false; // Tắt bộ lọc chưa xử lý khi bật bộ lọc cần xử lý ngay
    }
    this.applyFilters();
  }

  filterPendingOrders(): void {
    this.isPendingFilter = !this.isPendingFilter;
    if (this.isPendingFilter) {
      this.isUrgentFilter = false; // Tắt bộ lọc cần xử lý ngay khi bật bộ lọc chưa xử lý
    }
    this.applyFilters();
  }

  setStatusFilter(status: string): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  setPaymentFilter(payment: string): void {
    this.paymentFilter = payment;
    this.applyFilters();
  }

  // Order details
  showOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    setTimeout(() => {
      this.selectedOrder = null;
    }, 300);
  }

  // Delete order with confirmation
  confirmDeleteOrder(orderId: number, event: Event): void {
    // Stop propagation to prevent row selection
    if (event) {
      event.stopPropagation();
    }
    
    this.orderIdToDelete = orderId;
    this.showDeleteConfirm = true;
  }
  
  // Cancel delete
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.orderIdToDelete = null;
    
    // Show cancel message
    this.messageService.add({
      severity: 'info',
      summary: 'Đã hủy thao tác',
      detail: 'Bạn đã hủy việc xóa đơn hàng',
      life: 3000
    });
  }
  
  // Proceed with delete after confirmation
  proceedDelete(): void {
    if (this.orderIdToDelete) {
      this.deleteOrder(this.orderIdToDelete);
      this.showDeleteConfirm = false;
      this.orderIdToDelete = null;
    }
  }

  // Delete order
  deleteOrder(orderId: number): void {
    this.isLoading = true;
    
    this.orderService.deleteOrder(orderId).subscribe({
      next: () => {
        // Remove from local array
        this.allOrders = this.allOrders.filter(order => order.id !== orderId);
        this.applyFilters();
        this.isLoading = false;
        
        // Show success message
        this.messageService.add({
          severity: 'success',
          summary: 'Xóa đơn hàng thành công',
          detail: `Đơn hàng #${orderId} đã được xóa khỏi hệ thống`,
          life: 5000
        });
      },
      error: (error) => {
        console.error('Error deleting order:', error);
        this.isLoading = false;
        
        // Show error message
        this.messageService.add({
          severity: 'success',
          summary: 'Xóa đơn hàng thành công',
          detail: `Đơn hàng #${orderId} đã được xóa khỏi hệ thống`,
          life: 5000
        });
      }
    });
  }

  // Update order status
  updateOrderStatus(orderId: number, newStatus: string): void {
    // Find the existing order
    const orderIndex = this.allOrders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return;
    
    const existingOrder = this.allOrders[orderIndex];
    
    // Get user_id from localStorage (current admin user)
    const userJSON = localStorage.getItem('user');
    const currentUser = userJSON ? JSON.parse(userJSON) : null;
    
    // Create OrderDTO with all required fields
    const orderData = new OrderDTO({
      user_id: currentUser?.id ?? 1, // Use logged-in admin user ID from localStorage
      full_name: existingOrder.customer,
      order_type: 'Online',
      email: existingOrder.email || '',
      delivery_phone: existingOrder.phone,
      delivery_address: existingOrder.address,
      status: newStatus,
      note: existingOrder.note || '',
      total_price: existingOrder.total,
      payment_method: existingOrder.paymentMethod || 'cash',
      discount_amount: existingOrder.discountAmount?.toString() || '0',
      order_time: new Date(),
      table_number: existingOrder.tableNumber || 0,
      shipping_time: existingOrder.shippingTime ? new Date(existingOrder.shippingTime) : new Date(),
      cart_items: [] // Keep empty array for status update only
    });
    debugger;
    this.isLoading = true;
    
    this.orderService.updateOrder(orderId, orderData).subscribe({
      next: (response) => {
        debugger;
        // Update local data
        this.allOrders[orderIndex].status = this.mapStatus(newStatus);
        this.allOrders[orderIndex].payment = this.getPaymentStatus(
          existingOrder.paymentMethod || 'cash', 
          this.mapStatus(newStatus)
        );
        
        // Re-apply filters
        this.applyFilters();
        this.isLoading = false;
        
        // Show success message
        this.messageService.add({
          severity: 'success',
          summary: 'Cập nhật trạng thái thành công',
          detail: `Đơn hàng #${orderId} đã được cập nhật thành "${this.getStatusText(this.mapStatus(newStatus))}"`,
          life: 5000
        });

        // Reload the entire page
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Delay 1 second to show the success message
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        this.isLoading = false;
        
        // Show error message
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi cập nhật trạng thái',
          detail: `Không thể cập nhật trạng thái đơn hàng. Vui lòng kiểm tra kết nối và thử lại sau.`,
          life: 5000
        });
      }
    });
  }

  // Format currency
  formatCurrency(amount: number): string {
    return amount.toLocaleString('vi-VN', {maximumFractionDigits: 0}) + 'đ';
  }

  // Format date
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format shipping time to display similar to datetime-local input (like in edit popup)
  formatShippingTimeDisplay(dateString: string): string {
    if (!dateString) return 'Không có thông tin';
    
    const shippingTime = new Date(dateString);
    
    // Format exactly like in edit popup: toISOString().slice(0, 16) gives YYYY-MM-DDTHH:MM
    // Then format for display as DD/MM/YYYY HH:MM
    const isoString = shippingTime.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    const [datePart, timePart] = isoString.split('T');
    const [year, month, day] = datePart.split('-');
    
    return `${day}/${month}/${year} ${timePart}`;
  }

  

  // Xử lý khi hình ảnh lỗi
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'assets/image/image-placeholder.png';
    }
  }

  // Các phương thức hiển thị tiếng Việt
  getStatusText(status: string): string {
    if (!status) return 'Không xác định';
    const statusKey = status.toLowerCase();
    return this.statusLabels[statusKey] || status;
  }

  getPaymentText(payment: string): string {
    return this.paymentLabels[payment.toLowerCase()] || payment;
  }

  getPaymentMethodText(method: string | undefined): string {
    if (!method) return 'Tiền mặt';
    const methodKey = method.toLowerCase();
    
    if (methodKey.includes('vnpay')) {
      return 'Thanh toán qua VnPay';
    } else if (methodKey.includes('momo')) {
      return 'Thanh toán qua Ví MoMo';
    } else if (methodKey.includes('cash') || methodKey.includes('cod')) {
      return 'Tiền mặt';
    }
    
    return this.paymentMethodLabels[methodKey] || method;
  }

  // Helper method to safely access order properties
  safeOrderProperty(index: number | null, property: keyof Order, defaultValue: any = 0): any {
    if (index === null || !this.filteredOrders || index < 0 || index >= this.filteredOrders.length) {
      return defaultValue;
    }
    
    const order = this.filteredOrders[index];
    return order && order[property] !== undefined ? order[property] : defaultValue;
  }

  // Cập nhật phương thức xác định trạng thái thanh toán
  getPaymentStatus(paymentMethod: string, status?: string): 'paid' | 'unpaid' {
    const method = paymentMethod ? paymentMethod.toLowerCase() : 'cod';
    
    // Nếu status là Completed (đã giao hàng), coi như đã thanh toán
    if (status === 'Completed') {
      return 'paid';
    }
    
    // COD là chưa thanh toán, các phương thức khác (vnpay, momo) là đã thanh toán
    return method === 'cod' || method === 'cash' ? 'unpaid' : 'paid';
  }

  // Tính tổng giá trị đơn hàng dựa trên các sản phẩm
  calculateSubtotal(items: OrderItem[]): number {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }

  // Calculate subtotal from items
  calculateOrderSubtotal(index: number | null): number {
    if (index === null || !this.filteredOrders || index < 0 || index >= this.filteredOrders.length) {
      return 0;
    }
    
    const order = this.filteredOrders[index];
    if (!order || !order.items || order.items.length === 0) {
      return 0;
    }
    
    return order.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }

  // Phương thức in hóa đơn chuyên nghiệp
  printInvoice(orderId: number): void {
    const orderToPrint = this.filteredOrders.find(order => order.id === orderId);
    if (!orderToPrint) return;
    
    // Tạo cửa sổ in mới
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Không thể mở cửa sổ in. Vui lòng kiểm tra trình duyệt của bạn.');
      alert('Không thể mở cửa sổ in. Vui lòng kiểm tra trình duyệt của bạn.');
      return;
    }
    
    // Tính toán các giá trị cho hóa đơn
    const subtotal = this.calculateSubtotal(orderToPrint.items);
    const now = new Date();
    const invoiceNumber = `INV-${orderToPrint.id}-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    
    // Xác định trạng thái thanh toán và phương thức thanh toán
    const paymentMethod = orderToPrint.paymentMethod ? orderToPrint.paymentMethod.toLowerCase() : 'cash';
    let displayPaymentMethod = 'Tiền mặt';
    let paymentStatus = 'CHƯA THANH TOÁN';
    
    // Hiển thị phương thức thanh toán
    if (paymentMethod.includes('vnpay')) {
      displayPaymentMethod = 'Thanh toán qua VnPay';
      paymentStatus = 'ĐÃ THANH TOÁN';
    } else if (paymentMethod.includes('momo')) {
      displayPaymentMethod = 'Thanh toán qua Ví MoMo';
      paymentStatus = 'ĐÃ THANH TOÁN';
    }
    
    // Nếu đơn hàng đã hoàn thành, đánh dấu là đã thanh toán
    if (orderToPrint.status === 'Completed') {
      paymentStatus = 'ĐÃ THANH TOÁN';
    }
    
    // Quyết định hiển thị dấu mộc đã thanh toán
    const shouldShowPaidStamp = paymentStatus === 'ĐÃ THANH TOÁN';
    
    // HTML cho trang in
    const printContent = `
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <title>Hóa đơn #${invoiceNumber}</title>
          <style>
            @page {
              size: A4;
              margin: 1cm;
            }
            body {
              font-family: 'Times New Roman', serif;
              margin: 0;
              padding: 0;
              font-size: 12pt;
              line-height: 1.4;
              color: #000;
            }
            * {
              box-sizing: border-box;
            }
            .invoice-wrapper {
              width: 100%;
              padding: 10px;
              position: relative;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 20px;
            }
            .company-info {
              width: 60%;
            }
            .company-name {
              font-size: 18pt;
              font-weight: bold;
              margin-bottom: 5px;
              color: #d32f2f;
            }
            .company-details {
              font-size: 10pt;
            }
            .invoice-title {
              width: 40%;
              text-align: right;
            }
            .invoice-label {
              font-size: 24pt;
              font-weight: bold;
              color: #d32f2f;
              margin-bottom: 15px;
            }
            .invoice-number, .invoice-date {
              font-size: 10pt;
              margin-bottom: 5px;
            }
            .invoice-number span, .invoice-date span {
              font-weight: bold;
            }
            .customer-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .billing-to, .ship-to {
              width: 48%;
            }
            .section-title {
              font-weight: bold;
              margin-bottom: 8px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .customer-details {
              font-size: 10pt;
            }
            .payment-details {
              width: 100%;
              margin-bottom: 20px;
            }
            .payment-info {
              display: flex;
              justify-content: space-between;
            }
            .payment-method, .payment-status {
              width: 48%;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            thead {
              background-color: #f2f2f2;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .summary-section {
              width: 100%;
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .summary-details {
              width: 60%;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
            }
            .summary-title {
              width: 60%;
              text-align: right;
              font-weight: normal;
            }
            .summary-value {
              width: 40%;
              text-align: right;
            }
            .total-row {
              font-weight: bold;
              font-size: 14pt;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 10pt;
              color: #555;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin: 40px 0 20px;
              page-break-inside: avoid;
            }
            .signature-box {
              width: 30%;
              text-align: center;
            }
            .signature-title {
              font-weight: bold;
              margin-bottom: 60px;
            }
            .signature-name {
              border-top: 1px dashed #000;
              padding-top: 5px;
              font-weight: bold;
            }
            .barcode {
              text-align: center;
              margin: 20px 0;
            }
            .terms-conditions {
              font-size: 9pt;
              margin-top: 30px;
            }
            .paid-stamp {
              position: absolute;
              top: 40%;
              left: 35%;
              transform: rotate(-30deg);
              font-size: 72pt;
              color: rgba(211, 47, 47, 0.3);
              font-weight: bold;
              z-index: 1;
              border: 10px solid rgba(211, 47, 47, 0.3);
              border-radius: 50%;
              padding: 20px;
              width: 200px;
              height: 200px;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              line-height: 1;
            }
            @media print {
              .print-button {
                display: none;
              }
            }
            .print-button {
              background: #d32f2f;
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 14pt;
              cursor: pointer;
              margin: 20px auto;
              display: block;
            }
            .print-button:hover {
              background: #b71c1c;
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            ${shouldShowPaidStamp ? '<div class="paid-stamp">ĐÃ<br>THANH<br>TOÁN</div>' : ''}
            
            <div class="invoice-header">
              <div class="company-info">
                <div class="company-name">PIZZING PIZZA</div>
                <div class="company-details">
                  <p>Công ty TNHH PizZing Việt Nam</p>
                  <p>Địa chỉ: 123 Đường Pizza, Quận 1, TP.HCM</p>
                  <p>MST: 0123456789</p>
                  <p>Hotline: 1900-1234 | Email: support@pizzingpizza.com</p>
                </div>
              </div>
              <div class="invoice-title">
                <div class="invoice-label">HÓA ĐƠN</div>
                <div class="invoice-number"><span>Số hóa đơn:</span> ${invoiceNumber}</div>
                <div class="invoice-date"><span>Ngày:</span> ${this.formatDate(orderToPrint.orderDate)}</div>
                <div class="invoice-date"><span>Ngày in:</span> ${this.formatDate(new Date().toISOString())}</div>
              </div>
            </div>

            <div class="customer-section">
              <div class="billing-to">
                <div class="section-title">THÔNG TIN KHÁCH HÀNG:</div>
                <div class="customer-details">
                  <p><strong>Khách hàng:</strong> ${orderToPrint.customer}</p>
                  <p><strong>Số điện thoại:</strong> ${orderToPrint.phone}</p>
                  <p><strong>Email:</strong> ${orderToPrint.email || 'Không có'}</p>
                </div>
              </div>
              <div class="ship-to">
                <div class="section-title">ĐỊA CHỈ GIAO HÀNG:</div>
                <div class="customer-details">
                  <p>${orderToPrint.address}</p>
                  <p><strong>Ghi chú:</strong> ${orderToPrint.note || 'Không có ghi chú'}</p>
                </div>
              </div>
            </div>

            <div class="payment-details">
              <div class="section-title">THÔNG TIN THANH TOÁN:</div>
              <div class="payment-info">
                <div class="payment-method">
                  <p><strong>Phương thức thanh toán:</strong> ${displayPaymentMethod}</p>
                </div>
                <div class="payment-status">
                  <p><strong>Trạng thái thanh toán:</strong> ${paymentStatus}</p>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="text-center">STT</th>
                  <th>Tên sản phẩm</th>
                  <th>Size</th>
                  <th>Phân loại</th>
                  <th class="text-right">Đơn giá</th>
                  <th class="text-center">SL</th>
                  <th class="text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${orderToPrint.items.map((item, index) => `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.size?.size_name || 'N/A'}</td>
                    <td>${item.baseType?.base_name || 'N/A'}</td>
                    <td class="text-right">${this.formatCurrency(item.price)}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${this.formatCurrency(item.subtotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="summary-section">
              <div class="summary-details">
                <div class="summary-row">
                  <div class="summary-title">Tạm tính:</div>
                  <div class="summary-value">${this.formatCurrency(subtotal)}</div>
                </div>
                ${orderToPrint.discountAmount && orderToPrint.discountAmount > 0 ? `
                  <div class="summary-row">
                    <div class="summary-title">Giảm giá:</div>
                    <div class="summary-value">-${this.formatCurrency(orderToPrint.discountAmount)}</div>
                  </div>
                ` : ''}
                ${orderToPrint.shippingFee && orderToPrint.shippingFee > 0 ? `
                  <div class="summary-row">
                    <div class="summary-title">Phí vận chuyển:</div>
                    <div class="summary-value">${this.formatCurrency(orderToPrint.shippingFee)}</div>
                  </div>
                ` : ''}
                <div class="summary-row total-row">
                  <div class="summary-title">Tổng cộng:</div>
                  <div class="summary-value">${this.formatCurrency(orderToPrint.total)}</div>
                </div>
              </div>
            </div>

            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-title">Người mua hàng</div>
                <div class="signature-name">${orderToPrint.customer}</div>
              </div>
              <div class="signature-box">
                <div class="signature-title">Người giao hàng</div>
                <div class="signature-name"></div>
              </div>
              <div class="signature-box">
                <div class="signature-title">Người bán hàng</div>
                <div class="signature-name">PizZing Pizza</div>
              </div>
            </div>

            <div class="barcode">
              <div style="font-family: 'Courier New', monospace;">||||||||||||||||||||||||||||||</div>
              <div>${invoiceNumber}</div>
            </div>

            <div class="terms-conditions">
              <p><strong>Điều khoản & điều kiện:</strong></p>
              <ol>
                <li>Hóa đơn này được coi là hợp lệ khi có đầy đủ thông tin và chữ ký của các bên liên quan.</li>
                <li>Khách hàng vui lòng kiểm tra kỹ hàng hóa trước khi nhận hàng.</li>
                <li>Mọi thắc mắc về hóa đơn, vui lòng liên hệ hotline: 1900-1234 trong vòng 24 giờ kể từ khi nhận hàng.</li>
                <li>Hóa đơn GTGT điện tử sẽ được gửi qua email trong vòng 24 giờ (nếu có yêu cầu).</li>
              </ol>
            </div>

            <div class="footer">
              <p>Cảm ơn quý khách đã mua hàng tại PizZing Pizza!</p>
              <p>Hotline hỗ trợ: 1900-1234 | Website: www.pizzingpizza.com | Email: support@pizzingpizza.com</p>
            </div>

            
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Tự động in sau khi trang được tải
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }

  // Hàm chuyển số thành chữ (tiếng Việt)
  convertNumberToWords(number: number): string {
    const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];
    const tens = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
    
    const formatTens = (num: number): string => {
      if (num < 20) return units[num];
      const digit = num % 10;
      if (digit === 1) {
        return tens[Math.floor(num / 10)] + ' mốt';
      } else if (digit === 5) {
        return tens[Math.floor(num / 10)] + ' lăm';
      } else if (digit !== 0) {
        return tens[Math.floor(num / 10)] + ' ' + units[digit];
      }
      return tens[Math.floor(num / 10)];
    };
    
    const formatHundreds = (num: number): string => {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      
      if (remainder === 0) {
        return units[hundred] + ' trăm';
      } else if (remainder < 10) {
        return units[hundred] + ' trăm lẻ ' + units[remainder];
      } else {
        return units[hundred] + ' trăm ' + formatTens(remainder);
      }
    };
    
    const formatGroup = (num: number): string => {
      if (num === 0) return '';
      if (num < 20) return units[num];
      if (num < 100) return formatTens(num);
      if (num < 1000) return formatHundreds(num);
      return '';
    };
    
    if (number === 0) return 'không';
    
    const billion = Math.floor(number / 1000000000);
    number %= 1000000000;
    
    const million = Math.floor(number / 1000000);
    number %= 1000000;
    
    const thousand = Math.floor(number / 1000);
    number %= 1000;
    
    const hundred = number;
    
    let result = '';
    
    if (billion > 0) {
      result += formatGroup(billion) + ' tỷ ';
    }
    
    if (million > 0) {
      result += formatGroup(million) + ' triệu ';
    }
    
    if (thousand > 0) {
      result += formatGroup(thousand) + ' nghìn ';
    }
    
    if (hundred > 0) {
      result += formatGroup(hundred);
    }
    
    return result.trim();
  }

  // Sort method - Sắp xếp toàn bộ danh sách
  sortData(): void {
    if (this.sortColumn === 'shippingTime') {
      this.allOrders.sort((a, b) => {
        const timeA = a.shippingTime ? new Date(a.shippingTime).getTime() : 0;
        const timeB = b.shippingTime ? new Date(b.shippingTime).getTime() : 0;
        return this.sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      });
    } else {
      this.allOrders.sort((a, b) => {
        let valueA: any;
        let valueB: any;
        
        // Get the values to compare based on sortColumn
        switch (this.sortColumn) {
          case 'id':
            valueA = a.id;
            valueB = b.id;
            break;
          case 'customer':
            valueA = a.customer.toLowerCase();
            valueB = b.customer.toLowerCase();
            break;
          case 'orderDate':
            valueA = new Date(a.orderDate).getTime();
            valueB = new Date(b.orderDate).getTime();
            break;
          case 'phone':
            valueA = a.phone;
            valueB = b.phone;
            break;
          case 'address':
            valueA = a.address.toLowerCase();
            valueB = b.address.toLowerCase();
            break;
          case 'total':
            valueA = a.total;
            valueB = b.total;
            break;
          case 'status':
            valueA = a.status.toLowerCase();
            valueB = b.status.toLowerCase();
            break;
          case 'payment':
            valueA = a.payment.toLowerCase();
            valueB = b.payment.toLowerCase();
            break;
          default:
            valueA = a.id;
            valueB = b.id;
        }
        
        // Compare based on sortOrder
        const compareResult = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        return this.sortOrder === 'asc' ? compareResult : -compareResult;
      });
    }
  }

  // Lấy danh sách đơn hàng cho trang hiện tại
  getCurrentPageOrders(): Order[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredOrders.slice(startIndex, endIndex);
  }

  // Phương thức chuyển trang
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      // Không cần gọi loadOrders() nữa vì đã có sẵn dữ liệu
    }
  }

  // Phương thức tìm kiếm
  onSearch(): void {
    this.currentPage = 1;
    this.loadOrders(); // Tải lại toàn bộ dữ liệu khi tìm kiếm
  }

  // Toggle sort order and column
  toggleSort(column: string): void {
    if (this.sortColumn === column) {
      // Toggle sort order if same column is clicked
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new column and default to ascending
      this.sortColumn = column;
      this.sortOrder = 'asc';
    }
    
    // Apply sorting
    this.sortData();
  }
  
  // Get sort icon class
  getSortIconClass(column: string): string {
    if (this.sortColumn !== column) {
      return 'fa fa-sort'; // Default sort icon
    }
    
    return this.sortOrder === 'asc' ? 'fa fa-sort-up' : 'fa fa-sort-down';
  }

  // Format date for datetime-local input
  formatDateTimeForInput(date: Date): string {
    // Format for datetime-local input (YYYY-MM-DDThh:mm)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  
  // Load product data for dropdowns
  loadProductData(): void {
    console.log('Loading product data...');
    
    // Load pizzas
    this.pizzaService.getPizzas('price', 0, 999999, '', 0, 100).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        console.log('Pizza API response:', response);
        
        try {
          if (response && response.pizzas && Array.isArray(response.pizzas)) {
            this.availableProducts = response.pizzas;
          } else if (Array.isArray(response)) {
            this.availableProducts = response;
          } else {
            this.availableProducts = [];
            console.error('Pizza response format not recognized:', response);
          }
          
          console.log('Processed available products:', this.availableProducts);
          
          if (this.availableProducts.length === 0) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Không có sản phẩm',
              detail: 'Không tìm thấy sản phẩm nào trong hệ thống',
              life: 5000
            });
          }
        } catch (err) {
          console.error('Error processing pizza data:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi dữ liệu',
            detail: 'Không thể tải dữ liệu sản phẩm',
            life: 5000
          });
        }
      },
      error: (error: any) => {
        console.error('Error loading pizzas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi kết nối',
          detail: 'Không thể tải dữ liệu sản phẩm từ máy chủ',
          life: 5000
        });
      }
    });
    
    // Load sizes
    this.sizeService.getSizes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        console.log('Size API response:', response);
        
        try {
          if (response && response.sizes && Array.isArray(response.sizes)) {
            this.availableSizes = response.sizes;
          } else if (Array.isArray(response)) {
            this.availableSizes = response;
          } else {
            this.availableSizes = [];
            console.error('Size response format not recognized:', response);
          }
          
          console.log('Processed available sizes:', this.availableSizes);
          
          if (this.availableSizes.length === 0) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Không có kích thước',
              detail: 'Không tìm thấy kích thước nào trong hệ thống',
              life: 5000
            });
          }
        } catch (err) {
          console.error('Error processing size data:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi dữ liệu',
            detail: 'Không thể tải dữ liệu kích thước',
            life: 5000
          });
        }
      },
      error: (error: any) => {
        console.error('Error loading sizes:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi kết nối',
          detail: 'Không thể tải dữ liệu kích thước từ máy chủ',
          life: 5000
        });
      }
    });
    
    // Load base types
    this.baseTypeService.getBaseTypes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        console.log('Base type API response:', response);
        
        try {
          if (response && response.base_types && Array.isArray(response.base_types)) {
            this.availableBases = response.base_types;
          } else if (Array.isArray(response)) {
            this.availableBases = response;
          } else {
            this.availableBases = [];
            console.error('Base type response format not recognized:', response);
          }
          
          console.log('Processed available bases:', this.availableBases);
          
          if (this.availableBases.length === 0) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Không có Phân loại',
              detail: 'Không tìm thấy Phân loại nào trong hệ thống',
              life: 5000
            });
          }
        } catch (err) {
          console.error('Error processing base type data:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi dữ liệu',
            detail: 'Không thể tải dữ liệu Phân loại',
            life: 5000
          });
        }
      },
      error: (error: any) => {
        console.error('Error loading base types:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi kết nối',
          detail: 'Không thể tải dữ liệu Phân loại từ máy chủ',
          life: 5000
        });
      }
    });
  }
  
  // Add Order Modal methods
  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.resetAddOrderForm();
    
    // Reset member properties
    this.isMemberOrder = false;
    this.selectedMember = null;
    this.memberNotFound = false;
    this.memberPhoneSearch = '';
  }
  
  resetAddOrderForm(): void {
    // Initialize the form with empty values
    this.addOrderForm = this.formBuilder.group({
      customer: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,11}$')]],
      phoneOrder: ['', [Validators.pattern('^[0-9]{10,11}$')]],
      email: ['', [Validators.email]],
      address: [''],  // Address validation will be conditional
      orderType: ['Online', [Validators.required]],
      status: ['Pending', [Validators.required]],
      paymentMethod: ['cash', [Validators.required]],
      shippingFee: [0, [Validators.min(0)]],  // Default to 0, will be updated based on order type
      discountAmount: [0, [Validators.min(0)]],
      shippingTime: [''],
      orderTime: [''],
      tableNumber: [null],
      note: [''],
      cartItems: this.formBuilder.array([])
    });
    
    // Set default isMemberOrder and useSamePhone
    this.isMemberOrder = false;
    this.useSamePhone = true;
    
    // Reset member-related fields
    this.selectedMember = null;
    this.memberNotFound = false;
    this.memberPhoneSearch = '';
    
    // Apply conditional validation for address field
    this.updateAddressValidation();
    
    // Add at least one cart item
    this.addCartItem();
  }
  
  // Access cart items form array
  get cartItemsFormArray(): FormArray {
    return this.addOrderForm.get('cartItems') as FormArray;
  }
  
  // Add a new cart item to the form
  addCartItem(): void {
    // Create a new item for the cart
    const newItem = this.formBuilder.group({
      productId: [null, Validators.required],
      sizeId: [null, Validators.required],
      baseId: [null, Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      itemNote: ['']
    });
    
    // Add value change listeners for productId, sizeId, and baseId
    const recalculatePrice = () => {
      const productId = newItem.get('productId')?.value;
      const sizeId = newItem.get('sizeId')?.value;
      const baseId = newItem.get('baseId')?.value;
      
      // Only calculate if all required values are present
      if (productId && sizeId && baseId) {
        const price = this.getPriceByIds(Number(productId), Number(sizeId), Number(baseId));
        newItem.get('price')?.setValue(price);
        
        // Update total price and member discount
        this.updateTotalPrice();
      }
    };
    
    // Add listeners for the three fields
    newItem.get('productId')?.valueChanges.subscribe(() => recalculatePrice());
    newItem.get('sizeId')?.valueChanges.subscribe(() => recalculatePrice());
    newItem.get('baseId')?.valueChanges.subscribe(() => recalculatePrice());
    newItem.get('quantity')?.valueChanges.subscribe(() => {
      // Just update the total price when quantity changes
      this.updateTotalPrice();
    });
    
    // Add the new item to the cart items array
    this.cartItemsFormArray.push(newItem);
  }

  // Helper method to calculate price based on IDs
  getPriceByIds(productId: number, sizeId: number, baseId: number): number {
    // Convert all IDs to numbers to ensure type safety
    const pId = Number(productId);
    const sId = Number(sizeId);
    const bId = Number(baseId);
    
    // Log for debugging
    console.log('Getting price for:', { pId, sId, bId });
    console.log('Available products:', this.availableProducts);
    console.log('Available sizes:', this.availableSizes);
    console.log('Available bases:', this.availableBases);
    
    const product = this.availableProducts.find(p => p.id === pId);
    const size = this.availableSizes.find(s => s.id === sId);
    const baseType = this.availableBases.find(b => b.id === bId);
    
    console.log('Found matches:', { product, size, baseType });
    
    if (product && size && baseType) {
      const price = product.base_price * size.price_multiplier + baseType.price;
      console.log('Calculated price:', price);
      return price;
    }
    
    console.log('Returning fallback price:', product?.base_price ?? 0);
    return product?.base_price ?? 0;
  }

  // Update subtotal when quantity or price changes
  updateItemSubtotal(index: number): void {
    const itemForm = this.cartItemsFormArray.at(index);
    const price = itemForm.get('price')?.value || 0;
    const quantity = itemForm.get('quantity')?.value || 1;
    
    // Update the total price for the entire order
    this.updateTotalPrice();
  }

  // Calculate subtotal for a single item
  calculateItemSubtotal(item: any): number {
    return (item.price || 0) * (item.quantity || 0);
  }

  // Calculate subtotal for all items
  calculateSubTotal(): number {
    let subtotal = 0;
    
    for (let i = 0; i < this.cartItemsFormArray.length; i++) {
      const item = this.cartItemsFormArray.at(i).value;
      subtotal += this.calculateItemSubtotal(item);
    }
    
    return subtotal;
  }

  // Calculate total price including shipping and discounts
  calculateTotal(): number {
    const subtotal = this.calculateSubTotal();
    const shippingFee = this.addOrderForm.get('orderType')?.value === 'Online' ? 30000 : 0;
    const discountAmount = this.addOrderForm.get('discountAmount')?.value || 0;
    
    return subtotal + shippingFee - discountAmount;
  }

  // Update total price field when cart items change
  updateTotalPrice(): void {
    // Recalculate the total
    const newTotal = this.calculateTotal();
    
    // If member is selected, update discount whenever total changes
    if (this.isMemberOrder && this.selectedMember) {
      this.updateDiscountFromMembership();
    }
  }

  // Format date for backend compatibility with java.util.Date
  formatDateForBackend(date: Date): string {
    // Format as yyyy-MM-dd'T'HH:mm:ss.SSSZ
    // This format is compatible with java.util.Date parsing
    const isoString = date.toISOString();
    return isoString;
  }

  // Format shipping time for backend while preserving exact local time
  formatShippingTimeForBackend(datetimeLocalValue: string): string {
    if (!datetimeLocalValue) return '';
    
    // datetimeLocalValue comes in format: "YYYY-MM-DDTHH:MM"
    // Send it directly as ISO format without any Date conversion
    // This preserves the exact time user entered
    
    // Add seconds and 'Z' to make it a valid ISO string
    return datetimeLocalValue + ':00.000Z';
  }

  // Submit the add order form
  submitAddOrder(): void {
    if (this.addOrderForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.addOrderForm.controls).forEach(key => {
        const control = this.addOrderForm.get(key);
        if (key === 'cartItems' && control instanceof FormArray) {
          const itemsArray = control as FormArray;
          for (let i = 0; i < itemsArray.length; i++) {
            const itemGroup = itemsArray.at(i) as FormGroup;
            Object.keys(itemGroup.controls).forEach(itemKey => {
              itemGroup.get(itemKey)?.markAsTouched();
            });
          }
        } else {
          control?.markAsTouched();
        }
      });
      
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng điền đầy đủ thông tin bắt buộc và kiểm tra lại dữ liệu nhập',
        life: 3000
      });
      return;
    }
    
    if (this.cartItemsFormArray.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Thêm sản phẩm',
        detail: 'Vui lòng thêm ít nhất một sản phẩm vào đơn hàng',
        life: 5000
      });
      return;
    }
    
    // Set submitting state
    this.isSubmitting = true;
    
    const formValue = this.addOrderForm.value;
    
    // Use the already set order time, which is current time + 1 minute
    const orderTime = formValue.orderTime ? new Date(formValue.orderTime) : new Date(Date.now() + 60000);
    
    // Use shipping time from form if provided
    const shippingTime = formValue.shippingTime ? new Date(formValue.shippingTime) : null;
    
    // Calculate correct shipping fee
    const shippingFee = formValue.orderType === 'Online' ? 30000 : 0;
    
    // Prepare cart items with correct field names expected by backend
    const cartItems = formValue.cartItems.map((item: any) => ({
      pizza_id: Number(item.productId),
      size_id: Number(item.sizeId),
      base_id: Number(item.baseId),
      quantity: Number(item.quantity),
      price: Number(item.price)
    }));
    
    // Determine user_id based on order type
   // const userId = this.isMemberOrder && this.selectedMember ? this.selectedMember.userId : 8;
    
    // Get user_id from localStorage (current admin user)
    const userJSON = localStorage.getItem('user');
    const currentUser = userJSON ? JSON.parse(userJSON) : null;
    
    // Create OrderDTO
    const orderData = new OrderDTO({
      user_id: currentUser?.id ?? 0, // Use logged-in admin user ID from localStorage
      full_name: formValue.customer,
      order_type: formValue.orderType,
      email: formValue.email || '',
      delivery_phone: formValue.phone,
      phone_order: formValue.phoneOrder || formValue.phone, 
      delivery_address: formValue.address || '',  // May be empty for non-Online orders
      status: 'Pending', // Default status for new orders
      note: formValue.note || '',
      total_price: this.calculateTotal(),
      payment_method: formValue.paymentMethod,
      discount_amount: formValue.discountAmount?.toString() || '0',
      order_time: this.formatDateForBackend(orderTime),
      table_number: formValue.tableNumber || 0,
      shipping_time: shippingTime ? this.formatShippingTimeForBackend(formValue.shippingTime) : null,
      cart_items: cartItems,
      shipping_fee: shippingFee
    });
    
    console.log('Sending order data to backend:', JSON.stringify(orderData));
    
    // Call the service to create the order using placeOrder
    this.orderService.placeOrder(orderData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          
          // Close the modal
          this.closeAddModal();
          
          // Show success message
          this.messageService.add({
            severity: 'success',
            summary: 'Tạo đơn hàng thành công',
            detail: `Đơn hàng mới đã được tạo thành công`,
            life: 5000
          });
          
          // Reload the entire page
          setTimeout(() => {
            window.location.reload();
          }, 1000); // Delay 1 second to show the success message
        },
        error: (error) => {
          console.error('Error creating order:', error);
          this.isSubmitting = false;
          
          // Show error message
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi tạo đơn hàng',
            detail: 'Không thể tạo đơn hàng mới. Vui lòng kiểm tra kết nối và thử lại sau.',
            life: 5000
          });
        }
      });
  }

  removeCartItem(index: number): void {
    this.cartItemsFormArray.removeAt(index);
    this.updateTotalPrice();
    
    // After removing item, update discount if this is a member order
    if (this.isMemberOrder && this.selectedMember) {
      this.updateDiscountFromMembership();
    }
  }

  // Set order type (regular or member)
  setOrderType(isMember: boolean): void {
    this.isMemberOrder = isMember;
    
    // For regular customers, use same phone by default
    if (!isMember) {
      this.useSamePhone = true;
      this.updatePhoneOrder();
    } else {
      // For members, we'll get phone from membership data
      this.useSamePhone = false;
    }
    
    // Reset member-related properties when switching types
    if (!isMember) {
      this.selectedMember = null;
      this.memberNotFound = false;
      this.memberPhoneSearch = '';
      
      // Reset discount amount in form
      this.addOrderForm.get('discountAmount')?.setValue(0);
    }
  }

  // Search for member by phone number
  searchMember(): void {
    if (!this.memberPhoneSearch || this.memberPhoneSearch.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập số điện thoại để tìm kiếm',
        life: 3000
      });
      return;
    }
    
    this.isSearchingMember = true;
    this.memberNotFound = false;
    
    // Send the phone as a string directly without parsing to number
    this.membershipService.getMembershipByUserPhone(this.memberPhoneSearch)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          debugger;
          this.isSearchingMember = false;
          
          // Check if the response has a membership property based on the API response structure
          if (response && response.membership) {
            const membershipData = response.membership;
            
            this.selectedMember = {
              userId: membershipData.id, // Use the membership ID as user ID
              fullName: membershipData.membershipTier + ' Member', // We don't have full name in the response
              phone: membershipData.phone,
              email: membershipData.email || '', // No email in the response
              level: membershipData.membership_tier,
              discountRate: membershipData.discount_rate || 0,
            };
            
            // Store the total spent amount
            this.memberTotalSpent = membershipData.total_spent || 0;
            
            // Update form with member data
            this.addOrderForm.patchValue({
              customer: this.selectedMember.fullName,
              phone: this.selectedMember.phone,
              phoneOrder: this.selectedMember.phone, // Also update phoneOrder field
            });
            
            // Calculate discount amount based on current subtotal
            this.updateDiscountFromMembership();
            
            this.messageService.add({
              severity: 'success',
              summary: 'Tìm thấy thành viên',
              detail: `Đã tìm thấy thành viên: ${this.selectedMember.level}`,
              life: 3000
            });
          } else {
            this.selectedMember = null;
            this.memberNotFound = true;
            this.memberTotalSpent = 0;
            
            this.messageService.add({
              severity: 'error',
              summary: 'Không tìm thấy',
              detail: 'Không tìm thấy thành viên với số điện thoại này',
              life: 3000
            });
          }
        },
        error: (error) => {
          this.isSearchingMember = false;
          this.selectedMember = null;
          this.memberNotFound = true;
          this.memberTotalSpent = 0;
          
          console.error('Error searching for member:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi tìm kiếm',
            detail: 'Đã xảy ra lỗi khi tìm kiếm thành viên',
            life: 3000
          });
        }
      });
  }
  
  // Update discount amount based on member discount rate
  updateDiscountFromMembership(): void {
    if (this.selectedMember && this.selectedMember.discountRate > 0) {
      const subtotal = this.calculateSubTotal();
      
      // Convert discount rate to percentage if it's in decimal form (0.05 -> 5%)
      let discountRate = this.selectedMember.discountRate;
      if (discountRate < 1) {
        discountRate = discountRate * 100;
      }
      
      // Calculate the discount amount
      const discountAmount = subtotal * (discountRate / 100);
      
      // Update discount amount in form
      this.addOrderForm.get('discountAmount')?.setValue(discountAmount);
      
      // Update total price
      this.updateTotalPrice();
    }
  }

  // Confirm selected member
  confirmMember(): void {
    if (!this.selectedMember) return;
    
    // Update the form with member information
    this.addOrderForm.patchValue({
      customer: this.selectedMember.fullName,
      phone: this.selectedMember.phone,
      phoneOrder: this.selectedMember.phone, // Also update phoneOrder field
      email: this.selectedMember.email || '',
    });
    
    // Calculate discount based on member discount rate
    this.updateDiscountFromMembership();
    
    // Show confirmation message
    this.messageService.add({
      severity: 'success',
      summary: 'Thành viên được xác nhận',
      detail: `Đơn hàng sẽ được tạo cho thành viên ${this.selectedMember.fullName}`,
      life: 3000
    });
  }

  // Cancel member selection
  cancelMemberSelection(): void {
    this.selectedMember = null;
    this.memberPhoneSearch = '';
    this.memberTotalSpent = 0;
    
    // Reset discount amount to 0
    this.addOrderForm.get('discountAmount')?.setValue(0);
    
    // Update total price
    this.updateTotalPrice();
    
    // Show info message
    this.messageService.add({
      severity: 'info',
      summary: 'Đã hủy lựa chọn',
      detail: 'Bạn có thể tìm kiếm thành viên khác',
      life: 3000
    });
  }

  // Update phone_order when phone changes or when toggle is clicked
  updatePhoneOrder(): void {
    if (this.useSamePhone) {
      // Get the current phone value
      const phoneValue = this.addOrderForm.get('phone')?.value || '';
      
      // Set phone_order to the same value
      this.addOrderForm.get('phoneOrder')?.setValue(phoneValue);
    }
  }

  // Add a new validation method to handle conditional address validation
  updateAddressValidation(): void {
    const addressControl = this.addOrderForm.get('address');
    // Remove all validators, address is never required
    addressControl?.clearValidators();
    addressControl?.updateValueAndValidity({ emitEvent: false });
    this.updateTotalPrice(); // Update total price when shipping fee changes
  }

  setOrderTypeFilter(type: string): void {
    this.orderTypeFilter = type;
    this.applyFilters();
  }
}
  