import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../../service/order.service';
import { UserService } from '../../../service/user.service';
import { TokenService } from '../../../service/token.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environments';
import { ReviewService } from '../../../service/review.service';
import { ReviewDTO } from '../../../dtos/review/review.dto';
import { CartService } from '../../../service/cart.service';
import { MessageService } from 'primeng/api';

interface OrderDetail {
  id: number;
  pizza: any;
  size: any;
  baseType: any;
  quantity: number;
  price: number;
  note: string | null;
}

interface Order {
  id: number;
  user: any;
  fullName: string;
  email: string | null;
  phoneOrder: string | null;
  orderType: string;
  totalPrice: number;
  discountAmount: number;
  deliveryAddress: string;
  deliveryPhone: string;
  status: string;
  orderTime: number;
  orderDetails: OrderDetail[];
  table: any;
  note: string;
  active: boolean;
  shippingTime: number;
  paymentMethod: string;
  formattedOrderTime?: string;
  formattedShippingTime?: string;
}

interface ReviewPopupData {
  isVisible: boolean;
  isEdit: boolean;
  isEditExisting: boolean;
  orderDetailId: number;
  pizzaId: number;
  pizzaName: string;
  currentReview: any;
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-my-order',
  standalone: false,
  templateUrl: './my-order.component.html',
  styleUrl: './my-order.component.scss',
  providers: [MessageService]
})
export class MyOrderComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  filterValue: string = 'all';
  searchKeyword: string = '';
  isLoading: boolean = true;
  apiBaseUrl: string = environment.apiBaseUrl;
  user: any = null;
  reviewsMap: Map<number, any> = new Map(); // Map to store review status for each orderDetail
  
  // Review popup data
  reviewPopup: ReviewPopupData = {
    isVisible: false,
    isEdit: false,
    isEditExisting: false,
    orderDetailId: 0,
    pizzaId: 0,
    pizzaName: '',
    currentReview: null,
    rating: 5,
    comment: ''
  };

  constructor(
    private orderService: OrderService,
    private userService: UserService,
    private tokenService: TokenService,
    private router: Router,
    private reviewService: ReviewService,
    private cartService: CartService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.checkAuthentication();
  }

  checkAuthentication(): void {
    const token = this.tokenService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    
    const user = this.userService.getUserResponseFromLocalStorage();
    if (user && user.id) {
      this.user = user;
      this.loadOrders(user.id.toString());
    } else {
      this.userService.getUserDetail(token).subscribe({
        next: (response: any) => {
          this.userService.saveUserResponseToLocalStorage(response);
          this.user = response;
          if (response && response.id) {
            this.loadOrders(response.id.toString());
          } else {
            this.isLoading = false;
            // Handle case where user data doesn't contain ID
            console.error('User data does not contain ID');
          }
        },
        error: (error) => {
          console.error('Error getting user details:', error);
          this.isLoading = false;
          if (error.status === 401) {
            this.tokenService.removeToken();
            this.userService.removeUserFromLocalStorage();
            this.router.navigate(['/login']);
          }
        }
      });
    }
  }

  loadOrders(userId: string): void {
    this.isLoading = true;
    if (this.filterValue === 'cancelled') {
      this.loadCanceledOrders(userId);
    } else {
      this.orderService.getOrdersByUserId(userId).subscribe({
        next: (response: Order[]) => {
          this.orders = response;
          // Process orders for display
          this.processOrders();
          this.filterOrders();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.isLoading = false;
          // Empty array for no orders
          this.orders = [];
          this.filterOrders();
        }
      });
    }
  }

  loadCanceledOrders(userId: string): void {
    this.orderService.getUserOrderCanceled(userId).subscribe({
      next: (response: Order[]) => {
        this.orders = response;
        // Process orders for display
        this.processOrders();
        this.filteredOrders = [...this.orders]; // Show all canceled orders
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading canceled orders:', error);
        this.isLoading = false;
        this.orders = [];
        this.filteredOrders = [];
      }
    });
  }

  processOrders(): void {
    // Sort orders by orderTime in descending order (newest first)
    this.orders.sort((a, b) => {
      return b.orderTime - a.orderTime;
    });
    
    this.orders.forEach(order => {
      // Process pizza images to use full URLs
      if (order.orderDetails) {
        order.orderDetails.forEach(detail => {
          if (detail.pizza && detail.pizza.pizza_images && detail.pizza.pizza_images.length > 0) {
            detail.pizza.pizza_images.forEach((image: any) => {
              image.full_url = `${this.apiBaseUrl}/pizzas/images/${image.image_url}`;
            });
            // Set the first image as the main image
            detail.pizza.url = detail.pizza.pizza_images[detail.pizza.pizza_images.length - 1].full_url;
          } else if (detail.pizza) {
            // Default image if no images
            detail.pizza.url = 'assets/images/pizza-default.png';
          }
          
          // Check if review exists for this orderDetail
          this.checkReviewStatus(detail.id);
          console.log(this.reviewsMap)
        });
      }
      
      // Format orderTime and shippingTime to readable dates
      if (order.orderTime) {
        order.formattedOrderTime = this.formatTimestamp(order.orderTime);
      }
      
      if (order.shippingTime) {
        order.formattedShippingTime = this.formatTimestamp(order.shippingTime);
      }
    });
  }

  filterOrders(): void {
    if (this.filterValue === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order => 
        order.status.toLowerCase() === this.filterValue.toLowerCase()
      );
    }

    if (this.searchKeyword.trim() !== '') {
      this.filteredOrders = this.filteredOrders.filter(order => 
        order.id.toString().includes(this.searchKeyword.toLowerCase()) ||
        order.orderDetails.some(detail => 
          detail.pizza.name.toLowerCase().includes(this.searchKeyword.toLowerCase())
        )
      );
    }
  }

  onFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterValue = select.value;
    if (this.user && this.user.id) {
      this.loadOrders(this.user.id.toString());
    }
  }

  onSearch(event: Event): void {
    this.searchKeyword = (event.target as HTMLInputElement).value;
    this.filterOrders();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  }
  
  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getOrderStatusTranslation(status: string): string {
    switch(status.toLowerCase()) {
      case 'completed':
        return 'Hoàn thành';
      case 'pending':
        return 'Đang xử lý';
      case 'processing':
        return 'Đang chuẩn bị';
      case 'delivering':
        return 'Đang giao hàng';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  getOrderStatusClass(status: string): string {
    switch(status.toLowerCase()) {
      case 'completed':
        return 'delivered';
      case 'pending':
      case 'processing':
      case 'delivering':
        return 'processing';
      case 'cancelled':
        return 'cancelled';
      default:
        return '';
    }
  }

  hasOrders(): boolean {
    return this.filteredOrders.length > 0;
  }

  viewOrderDetail(orderId: number): void {
    this.router.navigate(['/order', orderId]);
  }

  /**
   * Reorder an existing order by adding all items to cart and navigating to order page
   */
  reorder(order: Order): void {
    // Clear the current cart first
    this.cartService.clearCart();
    
    // Add each order detail to the cart
    if (order.orderDetails && order.orderDetails.length > 0) {
      // Loop through all order details
      order.orderDetails.forEach(detail => {
        if (detail.pizza && detail.size && detail.baseType) {
          // Create cart item from order detail
          const cartItem = {
            pizzaId: detail.pizza.id,
            sizeId: detail.size.id,
            typeId: detail.baseType.id,
            quantity: detail.quantity,
            price: detail.price,
            note: detail.note || ''
          };
          
          // Add item to cart
          this.cartService.addToCart(cartItem);
        }
      });
      
      // Store order info for prefilling in order screen
      const orderInfo = {
        fullName: order.fullName,
        deliveryAddress: order.deliveryAddress,
        deliveryPhone: order.deliveryPhone,
        note: order.note,
        email: order.email,
        paymentMethod: order.paymentMethod
      };
      
      // Save order info in localStorage for order component to use
      localStorage.setItem('reorderInfo', JSON.stringify(orderInfo));
      
      // Navigate to checkout page
      this.router.navigate(['/order']);
    } else {
      console.error('Cannot reorder: Order has no items');
    }
  }
  
  logout(): void {
    this.tokenService.removeToken();
    this.userService.removeUserFromLocalStorage();
    this.router.navigate(['/login']);
  }

  // Check if a review exists for an order detail
  checkReviewStatus(orderDetailId: number): void {
    this.reviewService.getReviewByOrderDetailId(orderDetailId).subscribe({
      next: (review) => {
        if (review && review.id) {
          console.log(review)
          // Process review data to make it easier to use
          const processedReview = {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            userId: review.user_id?.id,
            userName: review.user_id?.full_name,
            pizzaId: review.pizza_id?.id,
            pizzaName: review.pizza_id?.name,
            orderDetailId: review.orderdetail_id?.id,
            reviewTime: review.review_time ? new Date(review.review_time) : null
          };
          this.reviewsMap.set(orderDetailId, processedReview);
        } else {
          this.reviewsMap.set(orderDetailId, null);
        }
      },
      error: (error) => {
        console.error(`Error checking review for order detail ${orderDetailId}:`, error);
        this.reviewsMap.set(orderDetailId, null);
      }
    });
  }

  // Check if an order detail has a review
  hasReview(orderDetailId: number): boolean {
    return this.reviewsMap.has(orderDetailId) && this.reviewsMap.get(orderDetailId) !== null;
  }

  // Open review dialog or view existing review
  handleReview(orderDetailId: number, pizzaId: number, pizzaName: string): void {
    if (this.hasReview(orderDetailId)) {
      // View existing review
      this.viewReview(orderDetailId);
    } else {
      // Create new review
      this.createReview(orderDetailId, pizzaId, pizzaName);
    }
  }

  // View an existing review in a popup
  viewReview(orderDetailId: number): void {
    const review = this.reviewsMap.get(orderDetailId);
    if (review) {
      this.reviewPopup = {
        isVisible: true,
        isEdit: false,
        isEditExisting: false,
        orderDetailId: orderDetailId,
        pizzaId: review.pizzaId,
        pizzaName: review.pizzaName,
        currentReview: review,
        rating: review.rating,
        comment: review.comment
      };
    }
  }

  // Create a new review in a popup
  createReview(orderDetailId: number, pizzaId: number, pizzaName: string): void {
    this.reviewPopup = {
      isVisible: true,
      isEdit: true,
      isEditExisting: false,
      orderDetailId: orderDetailId,
      pizzaId: pizzaId,
      pizzaName: pizzaName,
      currentReview: null,
      rating: 5,
      comment: ''
    };
  }
  
  // Close the review popup
  closeReviewPopup(): void {
    this.reviewPopup.isVisible = false;
  }
  
  // Edit existing review
  editReview(): void {
    this.reviewPopup.isEdit = true;
    this.reviewPopup.isEditExisting = true;
  }
  
  // Submit the review (create or update)
  submitReview(): void {
    const reviewData: ReviewDTO = new ReviewDTO({
      rating: this.reviewPopup.rating,
      comment: this.reviewPopup.comment,
      user_id: this.user.id,
      pizza_id: this.reviewPopup.pizzaId,
      orderdetail_id: this.reviewPopup.orderDetailId,
      review_time: new Date()
    });
    
    if (this.reviewPopup.isEditExisting) {
      // Update existing review
      const reviewId = this.reviewPopup.currentReview.id;
      this.reviewService.updatePizza(reviewId, reviewData).subscribe({
        next: (response) => {
          // Update the reviewsMap with the updated review
          this.checkReviewStatus(this.reviewPopup.orderDetailId);
          this.closeReviewPopup();
        },
        error: (error) => {
          console.error('Error updating review:', error);
        }
      });
    } else if (this.reviewPopup.isEdit) {
      // Create new review
      this.reviewService.createPizza(reviewData).subscribe({
        next: (response) => {
          // Update the reviewsMap with the new review
          this.checkReviewStatus(this.reviewPopup.orderDetailId);
          this.closeReviewPopup();
        },
        error: (error) => {
          console.error('Error creating review:', error);
        }
      });
    }
  }
  
  // Set rating in the review popup
  setRating(rating: number): void {
    this.reviewPopup.rating = rating;
  }

  cancelOrder(orderId: number): void {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      this.orderService.deleteOrder(orderId).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đơn hàng đã được hủy thành công'
          });
          
          // Reload orders after cancellation
          if (this.user && this.user.id) {
            this.loadOrders(this.user.id.toString());
          }
        },
        error: (error) => {
          console.error('Error cancelling order:', error);
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đơn hàng đã được hủy thành công'
          });
        }
      });
    }
  }
}
