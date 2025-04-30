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

interface CartItemRaw {
  id: number;
  name: string;
  image?: string;
  size: string;
  type: string;
  quantity: number;
  price: number;
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
  styleUrl: './order.component.scss'
})
export class OrderComponent implements OnInit {
  orderForm: FormGroup;
  checkoutData: CheckoutData | null = null;
  isLoading = false;
  errorMessage = '';
  hours: number[] = [];
  minutes: string[] = ['00', '15', '30', '45'];
  today: Date;
  submitting = false;
  selectedPaymentMethod: string = 'cash'; // Default payment method
  paymentService = inject(PaymentService);

  // Maps for size and type IDs
  private sizeMap: {[key: string]: number} = {
    's': 1,
    'm': 2,
    'l': 3,
    'small': 1,
    'medium': 2,
    'large': 3,
    'nhỏ': 1,
    'vừa': 2, 
    'lớn': 3
  };
  
  private typeMap: {[key: string]: number} = {
    'thin': 1,
    'thick': 2, 
    'regular': 3,
    'đế mỏng': 1,
    'đế dày': 2,
    'đế thường': 3,
    'mỏng': 1,
    'dày': 2,
    'thường': 3
  };

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router,
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

    // Generate hours from opening time (8:00) to closing time (21:00)
    for (let i = 8; i <= 21; i++) {
      this.hours.push(i);
    }
  }

  ngOnInit(): void {
    // Get checkout data from the service
    this.checkoutData = this.cartService.getCheckoutData();

    // If no checkout data (direct navigation to order page), redirect to cart
    if (!this.checkoutData || this.checkoutData.items.length === 0) {
      this.router.navigate(['/cart']);
    }
    
    // Try to prefill user data if available
    this.prefillUserData();
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
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user) {
          this.orderForm.patchValue({
            fullName: user.fullName || user.full_name || '',
            phone: user.phone || user.phoneNumber || '',
            email: user.email || '',
            address: user.address || ''
          });
        }
      } catch (e) {
        console.error('Error parsing user data from localStorage', e);
      }
    }
  }

  // Fill form with user profile data
  fillWithUserProfile(): void {
    this.prefillUserData();
  }

  onSubmit(): void {
    if (!this.checkoutData) {
      this.errorMessage = 'Không có thông tin giỏ hàng, vui lòng thử lại.';
      return;
    }

    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
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

    // Get raw cart data from localStorage to include all fields
    const rawCartData = localStorage.getItem('cart');
    let cartItems: OrderCartItem[] = [];
    
    if (rawCartData) {
      try {
        const rawItems: CartItemRaw[] = JSON.parse(rawCartData);
        
        // Map raw cart items to the format required by the API
        cartItems = rawItems.map(item => ({
          pizza_id: item.id,
          size_id: this.extractSizeId(item.size),
          base_id: this.extractTypeId(item.type),
          quantity: item.quantity,
          price: item.price,
          note: formValues.note || ''
        }));
      } catch (e) {
        console.error('Error parsing cart data from localStorage', e);
        // Fallback to using checkout data with less fields
        if (this.checkoutData && this.checkoutData.items) {
          cartItems = this.checkoutData.items.map(item => ({
            pizza_id: item.id,
            size_id: 1, // Default value if we can't extract from string
            base_id: 1, // Default value if we can't extract from string
            quantity: item.quantity,
            price: item.price,
            note: formValues.note || ''
          }));
        }
      }
    }

    // Create order DTO with payment method from form and properly formatted dates
    const orderData: OrderDTO = new OrderDTO({
      user_id: 1, // Fixed user ID as per requirement
      full_name: formValues.fullName,
      order_type: 'Online', // From ENUM('Online', 'Dine-in', 'Takeaway')
      email: formValues.email || '',
      delivery_phone: formValues.phone,
      delivery_address: formValues.address,
      status: 'Pending', // From ENUM('Pending', 'Preparing', 'Delivering', 'Completed', 'Cancelled')
      note: formValues.note || '',
      total_price: this.checkoutData.total,
      payment_method: formValues.paymentMethod, // Using selected payment method
      discount_amount: '0',
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
      debugger
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
          alert({
            error: err,
            defaultMsg: 'Lỗi kết nối đến cổng thanh toán',
            title: 'Lỗi Thanh Toán'
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
    alert('Đặt hàng thành công! Đơn hàng của bạn đã được ghi nhận và sẽ được giao đến bạn sớm nhất.');
  }
  
  // Helper method to extract size ID from size string
  private extractSizeId(sizeStr: string): number {
    const key = sizeStr.toLowerCase();
    return this.sizeMap[key] || 1; // Default to 1 if not found
  }
  
  // Helper method to extract type ID from type string
  private extractTypeId(typeStr: string): number {
    const key = typeStr.toLowerCase();
    return this.typeMap[key] || 1; // Default to 1 if not found
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


}
