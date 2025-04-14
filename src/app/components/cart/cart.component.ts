import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  // Properties for quantity control
  quantity: number = 1;
  itemPrice: number = 250000; // Giá mỗi sản phẩm
  shippingFee: number = 30000; // Phí vận chuyển
  subtotal: number = 0;
  total: number = 0;

  constructor() { }

  ngOnInit(): void {
    this.calculatePrices();
  }

  // Tăng số lượng
  increaseQuantity(): void {
    if (this.quantity < 50) {
      this.quantity++;
      this.calculatePrices();
    }
  }

  // Giảm số lượng
  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
      this.calculatePrices();
    }
  }

  // Cập nhật số lượng khi nhập trực tiếp
  updateQuantity(event: any): void {
    let newQuantity = parseInt(event.target.value);
    
    // Kiểm tra giá trị hợp lệ
    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
    } else if (newQuantity > 50) {
      newQuantity = 50;
    }
    
    this.quantity = newQuantity;
    this.calculatePrices();
  }

  // Tính toán giá
  calculatePrices(): void {
    this.subtotal = this.quantity * this.itemPrice;
    this.total = this.subtotal + this.shippingFee;
  }
}
