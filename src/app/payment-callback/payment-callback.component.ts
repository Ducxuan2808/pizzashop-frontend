import { Component, inject, OnInit } from '@angular/core';
import { ApiResponse } from '../responses/api.response';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../service/order.service';
import { CartService } from '../service/cart.service';

@Component({
  selector: 'app-payment-callback',
  standalone: false,
  templateUrl: './payment-callback.component.html', // Tách riêng HTML
  styleUrls: ['./payment-callback.component.scss']
})
export class PaymentCallbackComponent implements OnInit { // Kế thừa BaseComponent
  loading: boolean = true;
  paymentSuccess: boolean = false;
  activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  orderService = inject(OrderService);
  cartService: CartService = inject(CartService);
  router: Router = inject(Router);

  ngOnInit(): void {
    // Sử dụng this.activatedRoute từ BaseComponent
    this.activatedRoute.queryParams.subscribe(params => {
      debugger
      const vnp_ResponseCode = params['vnp_ResponseCode']; // Mã phản hồi từ VNPay
      const orderId:number = Number(params['vnp_TxnRef']); // Mã đơn hàng (nếu bạn truyền vào khi tạo URL thanh toán)
      debugger
      if (vnp_ResponseCode === '00') {
        // Thanh toán thành công
        this.handlePaymentSuccess(orderId);
      } else {
        // Thanh toán thất bại
        this.handlePaymentFailure();
      }
    });
  }

  handlePaymentSuccess(orderId: number): void {    
    // ✅ Thanh toán thành công
    debugger
    const orderData = JSON.parse(localStorage.getItem('pendingOrder') || '{}');

    this.orderService.placeOrder(orderData).subscribe({
      next: () => {
        debugger
        this.cartService.clearCart();
        this.cartService.clearCheckoutData();
        localStorage.removeItem('pendingOrder');
        
      },
      error: () => {
        alert('Thanh toán thành công nhưng đặt hàng thất bại!');
      }
    });
    // Chuyển hướng về trang thanh toán hoặc trang chủ
    setTimeout(() => {
      this.router.navigate(['/myorder']);
    }, 1000);
  }

  handlePaymentFailure(): void {
    this.loading = false;
    this.paymentSuccess = false;
    localStorage.removeItem('pendingOrder');
    alert({
      error: null,
      defaultMsg: 'Thanh toán thất bại. Vui lòng thử lại.',
      title: 'Lỗi'
    });
    // Chuyển hướng về trang thanh toán hoặc trang chủ
    setTimeout(() => {
      this.router.navigate(['/myorder']);
    }, 1000);
  }
}