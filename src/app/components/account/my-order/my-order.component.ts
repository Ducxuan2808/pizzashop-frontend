import { Component, OnInit } from '@angular/core';

interface OrderProduct {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant: string;
}

interface DeliveryInfo {
  recipientName: string;
  phone: string;
  address: string;
  method: string;
  expectedTime: string;
}

interface Order {
  id: string;
  date: string;
  status: 'processing' | 'delivered' | 'cancelled';
  products: OrderProduct[];
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  discount: number;
  paymentMethod: string;
  deliveryInfo: DeliveryInfo;
}

@Component({
  selector: 'app-my-order',
  standalone: false,
  templateUrl: './my-order.component.html',
  styleUrl: './my-order.component.scss'
})
export class MyOrderComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  filterValue: string = 'all';
  searchKeyword: string = '';

  constructor() { }

  ngOnInit(): void {
    this.loadOrders();
    this.filterOrders();
  }

  loadOrders(): void {
    // Mock data - in a real application, this would come from a service
    this.orders = [
      {
        id: 'DL12345',
        date: '15/05/2024',
        status: 'processing',
        products: [
          {
            id: 1,
            name: 'Pizza Hải Sản',
            image: 'assets/images/pizza-sample.jpg',
            price: 300000,
            quantity: 1,
            variant: 'Size: Lớn, Đế: Dày'
          },
          {
            id: 2,
            name: 'Coca Cola',
            image: 'assets/images/drink-sample.jpg',
            price: 30000,
            quantity: 2,
            variant: 'Size: Lớn'
          }
        ],
        subtotal: 360000,
        shippingFee: 30000,
        discount: 0,
        totalAmount: 390000,
        paymentMethod: 'Thanh toán khi nhận hàng (COD)',
        deliveryInfo: {
          recipientName: 'Xuan Nguyen',
          phone: '0987654321',
          address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
          method: 'Giao hàng tận nhà',
          expectedTime: '15:00 - 17:00, 16/05/2024'
        }
      },
      {
        id: 'DL12344',
        date: '10/05/2024',
        status: 'delivered',
        products: [
          {
            id: 3,
            name: 'Pizza Gà Nướng',
            image: 'assets/images/pizza-sample.jpg',
            price: 250000,
            quantity: 1,
            variant: 'Size: Vừa, Đế: Mỏng'
          }
        ],
        subtotal: 250000,
        shippingFee: 30000,
        discount: 30000,
        totalAmount: 250000,
        paymentMethod: 'Chuyển khoản ngân hàng',
        deliveryInfo: {
          recipientName: 'Xuan Nguyen',
          phone: '0987654321',
          address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
          method: 'Giao hàng tận nhà',
          expectedTime: '15:00 - 17:00, 11/05/2024'
        }
      },
      {
        id: 'DL12340',
        date: '05/05/2024',
        status: 'cancelled',
        products: [
          {
            id: 4,
            name: 'Pizza Thịt Hun Khói',
            image: 'assets/images/pizza-sample.jpg',
            price: 200000,
            quantity: 1,
            variant: 'Size: Nhỏ, Đế: Mỏng'
          }
        ],
        subtotal: 200000,
        shippingFee: 30000,
        discount: 0,
        totalAmount: 230000,
        paymentMethod: 'Thanh toán khi nhận hàng (COD)',
        deliveryInfo: {
          recipientName: 'Xuan Nguyen',
          phone: '0987654321',
          address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
          method: 'Giao hàng tận nhà',
          expectedTime: '15:00 - 17:00, 06/05/2024'
        }
      }
    ];
  }

  filterOrders(): void {
    if (this.filterValue === 'all') {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === this.filterValue);
    }

    if (this.searchKeyword.trim() !== '') {
      this.filteredOrders = this.filteredOrders.filter(order => 
        order.id.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        order.products.some(product => 
          product.name.toLowerCase().includes(this.searchKeyword.toLowerCase())
        )
      );
    }
  }

  onFilterChange(event: Event): void {
    this.filterValue = (event.target as HTMLSelectElement).value;
    this.filterOrders();
  }

  onSearch(event: Event): void {
    this.searchKeyword = (event.target as HTMLInputElement).value;
    this.filterOrders();
  }

  formatPrice(price: number): string {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '₫';
  }

  getTotalAmount(order: Order): number {
    return order.products.reduce((total, product) => total + (product.price * product.quantity), 0);
  }

  hasOrders(): boolean {
    return this.filteredOrders.length > 0;
  }

  viewOrderDetail(orderId: string): void {
    // In a real application, navigate to order detail page
    console.log('View order detail:', orderId);
  }

  reorder(orderId: string): void {
    // In a real application, add products to cart
    console.log('Reorder:', orderId);
  }
}
