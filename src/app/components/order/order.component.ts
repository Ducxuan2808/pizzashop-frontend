import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CheckoutData, CartItem } from '../../service/cart.service';
import { OrderService } from '../../service/order.service';
import { OrderDTO } from '../../dtos/order/order.dto';
import { CartItemDTO } from '../../dtos/order/cart.item.dto';
import { ApiResponse } from '../../responses/api.response';
import { PaymentService } from '../../service/payment.service';
import { HttpErrorResponse } from '@angular/common/http';
import { SizeService } from '../../service/size.service';
import { TypeService } from '../../service/type.service';
import { Size } from '../../model/size';
import { Type } from '../../model/type';
import { PizzaService } from '../../service/pizza.service';
import { Pizza } from '../../model/pizza';
import { MessageService } from 'primeng/api';
import { MembershipService } from '../../service/membership.service';
import { Membership } from '../../model/membership';

interface ExtendedCartItem extends CartItem {
  pizza?: Pizza;
  size?: Size;
  type?: Type;
}

interface OrderCartItem {
  pizza_id: number;
  size_id: number;
  base_id: number;
  quantity: number;
  price: number;
  note: string;
}

@Component({
  selector: 'app-order',
  standalone: false,
  templateUrl: './order.component.html',
  styleUrl: './order.component.scss',
  providers: [MessageService]
})
export class OrderComponent implements OnInit {
  orderForm: FormGroup;
  checkoutData: CheckoutData | null = null;
  extendedCartItems: ExtendedCartItem[] = [];
  isLoading = false;
  errorMessage = '';
  hours: number[] = [];
  minutes: string[] = ['00', '15', '30', '45'];
  today: Date;
  submitting = false;
  selectedPaymentMethod: string = 'cash'; // Default payment method
  paymentService = inject(PaymentService);
  sizes: Size[] = [];
  types: Type[] = [];
  pizzas: Pizza[] = [];
  
  // Membership related properties
  membership: Membership | null = null;
  isCheckingMembership = false;
  discountAmount = 0;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router,
    private sizeService: SizeService,
    private typeService: TypeService,
    private pizzaService: PizzaService,
    private messageService: MessageService,
    private membershipService: MembershipService
  ) {
    // Lấy ngày hiện tại theo múi giờ GMT+7
    this.today = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    
    this.orderForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
      email: ['', [Validators.email]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      deliveryDate: [this.formatDate(this.today), [Validators.required]],
      deliveryHour: ['', [Validators.required]],
      deliveryMinute: ['00', [Validators.required]],
      note: [''],
      paymentMethod: ['cash', [Validators.required]]
    });

    // Hours will be populated by updateAvailableHours() based on current time

    // Subscribe to phone changes to check membership
    this.orderForm.get('phone')?.valueChanges.subscribe(phone => {
      if (phone && phone.length >= 10) {
        this.checkMembership(phone);
      } else {
        this.membership = null;
        this.discountAmount = 0;
        if (this.checkoutData) {
          this.checkoutData.total = this.checkoutData.subtotal + this.checkoutData.shippingFee;
        }
      }
    });
  }

  ngOnInit(): void {
    // Get checkout data from the service
    this.checkoutData = this.cartService.getCheckoutData();

    // If no checkout data (direct navigation to order page), redirect to cart
    if (!this.checkoutData || this.checkoutData.items.length === 0) {
      this.router.navigate(['/cart']);
      return;
    }
    
    // Load sizes, types, and pizzas 
    this.loadSizesTypesAndPizzas();
    
    // Try to prefill user data if available
    this.prefillUserData();
    
    // Setup time validation
    this.setupDeliveryTimeValidation();
  }

  private loadSizesTypesAndPizzas(): void {
    this.isLoading = true;
    
    // Load sizes
    this.sizeService.getSizes().subscribe({
      next: (sizes) => {
        this.sizes = sizes;
        
        // Load types
        this.typeService.getTypes().subscribe({
          next: (types) => {
            this.types = types;
            
            // Get pizzas for cart items
            if (this.checkoutData && this.checkoutData.items.length > 0) {
              const pizzaIds = [...new Set(this.checkoutData.items.map(item => item.pizzaId))];
              
              if (pizzaIds.length > 0) {
                this.pizzaService.getPizzasByIds(pizzaIds).subscribe({
                  next: (pizzas) => {
                    this.pizzas = pizzas;
                    this.enrichCartItems();
                    this.isLoading = false;
                  },
                  error: (error) => {
                    console.error('Error loading pizzas', error);
                    this.isLoading = false;
                    this.enrichCartItems();
                  }
                });
              } else {
                this.isLoading = false;
                this.enrichCartItems();
              }
            } else {
              this.isLoading = false;
            }
          },
          error: (error) => {
            console.error('Error loading types', error);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading sizes', error);
        this.isLoading = false;
      }
    });
  }
  
  private enrichCartItems(): void {
    if (!this.checkoutData) return;
    
    // Create maps for pizzas, sizes, and types for quick lookup
    const pizzaMap = new Map<number, Pizza>();
    this.pizzas.forEach(pizza => {
      pizzaMap.set(pizza.id, pizza);
    });
    
    const sizeMap = new Map<number, Size>();
    this.sizes.forEach(size => {
      sizeMap.set(size.id, size);
    });
    
    const typeMap = new Map<number, Type>();
    this.types.forEach(type => {
      typeMap.set(type.id, type);
    });
    
    // Enrich cart items with pizza, size, and type details
    this.extendedCartItems = this.checkoutData.items.map(item => {
      const pizza = pizzaMap.get(item.pizzaId);
      const size = sizeMap.get(item.sizeId);
      const type = typeMap.get(item.typeId);
      
      return {
        ...item,
        pizza,
        size,
        type
      };
    });
  }

  formatDate(date: Date): string {
    // Đảm bảo ngày tháng theo múi giờ GMT+7
    const vnTime = new Date(date);
    const yyyy = vnTime.getUTCFullYear();
    const mm = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(vnTime.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  getMinDate(): string {
    // Đảm bảo sử dụng ngày hiện tại theo múi giờ GMT+7
    return this.formatDate(this.today);
  }
  
  getMaxDate(): string {
    // Đảm bảo sử dụng ngày tối đa theo múi giờ GMT+7
    const maxDate = new Date(this.today);
    maxDate.setDate(maxDate.getDate() + 7); // Allow ordering up to 7 days in advance
    return this.formatDate(maxDate);
  }

  // Prefill user data from localStorage if available
  private prefillUserData(): void {
    // Check if there's reorder information and use it
    const reorderInfoString = localStorage.getItem('reorderInfo');
    if (reorderInfoString) {
      try {
        const reorderInfo = JSON.parse(reorderInfoString);
        
        // Prefill form with reorder info
        this.orderForm.patchValue({
          fullName: reorderInfo.fullName || '',
          phone: reorderInfo.deliveryPhone || '',
          email: reorderInfo.email || '',
          address: reorderInfo.deliveryAddress || '',
          note: reorderInfo.note || '',
          paymentMethod: reorderInfo.paymentMethod || 'cash'
        });
        
        // Set selected payment method
        this.selectedPaymentMethod = reorderInfo.paymentMethod || 'cash';
        
        // Remove the reorder info from localStorage after using it
        localStorage.removeItem('reorderInfo');
        
        return; // Exit early, don't try to get user from localStorage
      } catch (e) {
        console.error('Error parsing reorder info:', e);
        localStorage.removeItem('reorderInfo');
      }
    }
    
    // If no reorder info, try to get user from localStorage
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        this.orderForm.patchValue({
          fullName: userData.full_name || userData.fullName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || userData.delivery_address || ''
        });
        
        // If we have a phone number, check for membership
        if (userData.phone && userData.phone.length >= 10) {
          this.checkMembership(userData.phone);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }

  // Fill form with user profile data
  fillWithUserProfile(): void {
    this.prefillUserData();
  }

  private setupDeliveryTimeValidation(): void {
    // Listen to delivery date and time changes to validate
    this.orderForm.get('deliveryDate')?.valueChanges.subscribe(() => {
      this.updateAvailableHours();
      this.validateDeliveryTime();
    });

    this.orderForm.get('deliveryHour')?.valueChanges.subscribe(() => {
      this.validateDeliveryTime();
    });

    this.orderForm.get('deliveryMinute')?.valueChanges.subscribe(() => {
      this.validateDeliveryTime();
    });

    // Initial validation
    this.updateAvailableHours();
  }

  private updateAvailableHours(): void {
    const now = new Date();
    const selectedDateStr = this.orderForm.get('deliveryDate')?.value;
    
    if (!selectedDateStr) return;

    const selectedDate = new Date(selectedDateStr);
    const isToday = this.isSameDate(selectedDate, now);

    // Reset hours array
    this.hours = [];

    if (isToday) {
      // If today, check current time
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // If after 21:00 (closing time), no hours available for today
      if (currentHour >= 21) {
        this.hours = [];
        // Auto select tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.orderForm.patchValue({
          deliveryDate: this.formatDate(tomorrow)
        });
        return;
      }

      // Calculate minimum hour (current + 1 hour)
      let minHour = currentHour + 1;
      
      // If close to hour boundary (e.g., 20:45), need to add 2 hours
      if (currentMinute > 45) {
        minHour = currentHour + 2;
      }

      // Generate available hours from minHour to 21:00
      for (let i = Math.max(minHour, 8); i <= 21; i++) {
        this.hours.push(i);
      }

      // If no hours available today, auto select tomorrow
      if (this.hours.length === 0) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.orderForm.patchValue({
          deliveryDate: this.formatDate(tomorrow)
        });
        // Generate hours for tomorrow
        for (let i = 8; i <= 21; i++) {
          this.hours.push(i);
        }
      }
    } else {
      // If not today, show all hours from 8:00 to 21:00
      for (let i = 8; i <= 21; i++) {
        this.hours.push(i);
      }
    }

    // Clear hour selection if current selected hour is not available
    const currentHour = this.orderForm.get('deliveryHour')?.value;
    if (currentHour && !this.hours.includes(parseInt(currentHour))) {
      this.orderForm.patchValue({
        deliveryHour: '',
        deliveryMinute: '00'
      });
    }
  }

  private validateDeliveryTime(): void {
    const deliveryDate = this.orderForm.get('deliveryDate')?.value;
    const deliveryHour = this.orderForm.get('deliveryHour')?.value;
    const deliveryMinute = this.orderForm.get('deliveryMinute')?.value;

    if (!deliveryDate || !deliveryHour || deliveryMinute === null) return;

    const selectedDate = new Date(deliveryDate);
    const selectedDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      parseInt(deliveryHour),
      parseInt(deliveryMinute)
    );

    const now = new Date();
    const minDeliveryTime = new Date(now.getTime() + 60 * 60 * 1000); // Current time + 1 hour

    // Check if selected time is valid
    if (selectedDateTime <= minDeliveryTime) {
      // Show error message
      this.messageService.add({
        severity: 'warn',
        summary: 'Thời gian giao hàng không hợp lệ',
        detail: 'Thời gian giao hàng phải lớn hơn giờ hiện tại ít nhất 1 tiếng.'
      });

      // Clear invalid time selection
      this.orderForm.patchValue({
        deliveryHour: '',
        deliveryMinute: '00'
      });
    }
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private isValidDeliveryTime(): boolean {
    const deliveryDate = this.orderForm.get('deliveryDate')?.value;
    const deliveryHour = this.orderForm.get('deliveryHour')?.value;
    const deliveryMinute = this.orderForm.get('deliveryMinute')?.value;

    if (!deliveryDate || !deliveryHour || deliveryMinute === null) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi thời gian giao hàng',
        detail: 'Vui lòng chọn đầy đủ thời gian giao hàng.'
      });
      return false;
    }

    const selectedDate = new Date(deliveryDate);
    const selectedDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      parseInt(deliveryHour),
      parseInt(deliveryMinute)
    );

    const now = new Date();
    const minDeliveryTime = new Date(now.getTime() + 60 * 60 * 1000); // Current time + 1 hour

    // Check if selected time is at least 1 hour from now
    if (selectedDateTime <= minDeliveryTime) {
      this.messageService.add({
        severity: 'error',
        summary: 'Thời gian giao hàng không hợp lệ',
        detail: 'Thời gian giao hàng phải lớn hơn giờ hiện tại ít nhất 1 tiếng.'
      });
      return false;
    }

    // Check if delivery time is within business hours (8:00 - 21:00)
    const deliveryHourNum = parseInt(deliveryHour);
    if (deliveryHourNum < 8 || deliveryHourNum > 21) {
      this.messageService.add({
        severity: 'error',
        summary: 'Thời gian giao hàng không hợp lệ',
        detail: 'Thời gian giao hàng phải trong khung giờ từ 8:00 đến 21:00.'
      });
      return false;
    }

    // Check if it's after closing time today
    if (this.isSameDate(selectedDate, now) && now.getHours() >= 21) {
      this.messageService.add({
        severity: 'error',
        summary: 'Quá giờ đặt hàng',
        detail: 'Hiện tại đã quá giờ đặt hàng. Vui lòng chọn ngày mai để giao hàng.'
      });
      return false;
    }

    return true;
  }

  onSubmit(): void {
    // Check if user is logged in
    const currentUser = localStorage.getItem('user');
    if (!currentUser) {
      // User is not logged in, redirect to login page
      this.router.navigate(['/login']);
      return;
    }

    if (!this.checkoutData) {
      this.errorMessage = 'Không có thông tin giỏ hàng, vui lòng thử lại.';
      return;
    }

    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    // Additional validation for delivery time
    if (!this.isValidDeliveryTime()) {
      this.submitting = false;
      return;
    }

    this.submitting = true;
    
    // Get form values
    const formValues = this.orderForm.value;
    
    // Create delivery time from date and hour/minute
    const deliveryDate = new Date(formValues.deliveryDate);
    const deliveryTime = new Date(
      deliveryDate.getFullYear(),
      deliveryDate.getMonth(),
      deliveryDate.getDate(),
      Number(formValues.deliveryHour),
      Number(formValues.deliveryMinute)
    );

    // Get current date and time for order_time
    const now = new Date();
    
    // Format order date properly to include hours, minutes and seconds
    const orderTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    );

    // Map cart items to the format required by the API
    const cartItems: OrderCartItem[] = this.cartService.getCartItems().map(item => ({
      pizza_id: item.pizzaId,
      size_id: item.sizeId,
      base_id: item.typeId,
      quantity: item.quantity,
      price: item.price,
      note: formValues.note || ''
    }));

    const userJSON = localStorage.getItem('user');
    const user = userJSON ? JSON.parse(userJSON) : null;

    // Create order DTO with payment method from form and properly formatted dates
    const orderData: OrderDTO = new OrderDTO({
      user_id: user?.id ?? 0, // Fixed user ID as per requirement
      full_name: formValues.fullName,
      order_type: 'Online', // From ENUM('Online', 'Dine-in', 'Takeaway')
      email: formValues.email || '',
      delivery_phone: formValues.phone,
      delivery_address: formValues.address,
      status: 'Pending', // From ENUM('Pending', 'Preparing', 'Delivering', 'Completed', 'Cancelled')
      note: formValues.note || '',
      total_price: this.checkoutData.total,
      payment_method: formValues.paymentMethod, // Using selected payment method
      discount_amount: this.discountAmount.toString(),
      order_time: orderTime,
      table_number: 0,
      shipping_time: deliveryTime,
      cart_items: cartItems
    });
    
    console.log('Placing order with data:', orderData);
    console.log('Order time formatted:', this.formatDateTime(orderTime));
    console.log('Shipping time formatted:', this.formatDateTime(deliveryTime));

    // Xử lý riêng cho phương thức thanh toán VNPay
    if (formValues.paymentMethod === 'vnpay') {
      const amount = orderData.total_price || 0;
      
      // Bước 1: Gọi API tạo link thanh toán
      // Gọi API để tạo URL thanh toán
      this.paymentService.createPaymentUrl({ amount, language: 'vn' }).subscribe({
        next: (res: ApiResponse) => {
          const paymentUrl = res.data;
          // Lưu thông tin đơn hàng tạm thời vào localStorage
          localStorage.removeItem('pendingOrder');
          localStorage.setItem('pendingOrder', JSON.stringify(orderData));
          // Redirect sang VNPAY
          window.location.href = paymentUrl;
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi Thanh Toán',
            detail: `Lỗi kết nối đến cổng thanh toán.`
          });
        }
      });
    } else {
      // Xử lý thông thường cho COD và các phương thức khác
      this.processNormalOrder(orderData);
    }
  }

  // Xử lý đặt hàng bình thường (COD)
  private processNormalOrder(orderData: OrderDTO): void {
    this.orderService.placeOrder(orderData).subscribe({
      next: (response) => {
        console.log('Order placed successfully', response);
        
        // Clear cart and checkout data
        this.cartService.clearCart();
        this.cartService.clearCheckoutData();
        
        // Show success alert
        this.showSuccessMessage();
        
        // Redirect to success page or order history
        this.router.navigate(['/myorder'], { 
          queryParams: { 
            success: true,
            order_id: response.id 
          } 
        });
      },
      error: (error) => {
        console.error('Error placing order', error);
        this.errorMessage = 'Đã xảy ra lỗi khi đặt hàng, vui lòng thử lại sau.';
        this.submitting = false;
      }
    });
  }

  // Add a method to show success message
  private showSuccessMessage(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đặt hàng thành công! Đơn hàng của bạn đã được ghi nhận và sẽ được giao đến bạn sớm nhất.'
    });
  }

  // Format price for display
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(price)
      .replace(/\s+/g, '');
  }
  
  // Format datetime for API
  formatDateTime(date: Date): string {
    // Chuyển đổi sang múi giờ GMT+7 (Việt Nam)
    const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    
    const yyyy = vnTime.getUTCFullYear();
    const mm = String(vnTime.getUTCMonth() + 1).padStart(2, '0'); // January is 0!
    const dd = String(vnTime.getUTCDate()).padStart(2, '0');
    const hh = String(vnTime.getUTCHours()).padStart(2, '0');
    const min = String(vnTime.getUTCMinutes()).padStart(2, '0');
    const ss = String(vnTime.getUTCSeconds()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }
  
  // Select payment method
  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod = method;
    this.orderForm.get('paymentMethod')?.setValue(method);
    
    // Nếu chọn VNPay hoặc Momo, có thể thêm các xử lý đặc biệt ở đây trong tương lai
    if (method === 'cash') {
      console.log('Đã chọn thanh toán khi nhận hàng (COD)');
    } else if (method === 'vnpay') {
      console.log('Đã chọn thanh toán qua VNPay');
      // Hiển thị thông báo hướng dẫn thanh toán VNPay
      setTimeout(() => {
        const vnpayInfo = document.querySelector('.payment-info');
        if (vnpayInfo) {
          vnpayInfo.classList.add('animate__animated', 'animate__fadeIn');
        }
      }, 100);
    } else if (method === 'momo') {
      console.log('Đã chọn thanh toán qua ví Momo');
      // Hiện tại chỉ hỗ trợ COD và VNPay, Momo sẽ được thêm sau
      alert('Phương thức thanh toán ví Momo sẽ được hỗ trợ trong thời gian tới!');
      this.selectedPaymentMethod = 'cash';
      this.orderForm.get('paymentMethod')?.setValue('cash');
    }
  }

  // Add membership discount functionality
  private checkMembership(phone: string): void {
    this.isCheckingMembership = true;
    this.membershipService.getMembershipByUserPhone(phone).subscribe({
      next: (response: any) => {
        if (response && response.membership) {
          this.membership = response.membership;
          this.calculateDiscount();
        } else {
          this.membership = null;
          this.discountAmount = 0;
          if (this.checkoutData) {
            this.checkoutData.total = this.checkoutData.subtotal + this.checkoutData.shippingFee;
          }
        }
        this.isCheckingMembership = false;
      },
      error: (error) => {
        console.error('Error checking membership:', error);
        this.membership = null;
        this.discountAmount = 0;
        if (this.checkoutData) {
          this.checkoutData.total = this.checkoutData.subtotal + this.checkoutData.shippingFee;
        }
        this.isCheckingMembership = false;
      }
    });
  }

  private calculateDiscount(): void {
    if (this.membership && this.checkoutData) {
      // Calculate discount based on the subtotal (before shipping fee)
      this.discountAmount = Math.round(this.checkoutData.subtotal * (this.membership.discount_rate / 100));
      
      // Update total in checkout data
      this.checkoutData.total = this.checkoutData.subtotal - this.discountAmount + this.checkoutData.shippingFee;
    } else {
      this.discountAmount = 0;
      if (this.checkoutData) {
        this.checkoutData.total = this.checkoutData.subtotal + this.checkoutData.shippingFee;
      }
    }
  }

  /**
   * Clear all form data
   */
  clearForm(): void {
    // Reset form to initial values
    this.orderForm.reset({
      fullName: '',
      phone: '',
      email: '',
      address: '',
      deliveryDate: this.formatDate(this.today),
      deliveryHour: '',
      deliveryMinute: '00',
      note: '',
      paymentMethod: 'cash'
    });
    
    // Reset payment method
    this.selectedPaymentMethod = 'cash';
    
    // Clear membership data
    this.membership = null;
    this.discountAmount = 0;
    if (this.checkoutData) {
      this.checkoutData.total = this.checkoutData.subtotal + this.checkoutData.shippingFee;
    }
    
    // Show success message
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã xóa tất cả thông tin đã điền'
    });
  }
}
