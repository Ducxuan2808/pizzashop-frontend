import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit{
  activeNavItem = 0;
  navItems = [
    { label: 'Trang chủ', link: '/' },
    { label: 'Giới thiệu', link: '/about' },
    { label: 'Sản phẩm', link: '/products' },
    { label: 'Tin tức', link: '/news' },
    { label: 'Câu hỏi thường gặp', link: '/faq' },
    { label: 'Liên hệ', link: '/contact' },
  ];
  searchKeyword: string = '';

  constructor(
    private router: Router,
    private searchService: SearchService
  ) {}

  setActiveNavItem(index: number) {
    this.activeNavItem = index;
  }

  ngOnInit(): void {
    // Adding the cart price update function to window after component initialization
    this.setupCartFunctions();
  }

  onSearch(): void {
    if (this.searchKeyword.trim()) {
      this.searchService.updateSearchKeyword(this.searchKeyword.trim());
      this.router.navigate(['/pizzas'], { 
        queryParams: { search: this.searchKeyword.trim() }
      });
    }
  }
  
  // Setup cart functions that will be used in the template
  private setupCartFunctions(): void {
    // Make the function accessible globally
    (window as any).updateCartQuantity = this.updateCartQuantity;
    (window as any).updateCartTotal = this.updateCartTotal;
    
    // Calculate initial total
    setTimeout(() => {
      this.updateCartTotal();
    }, 100);
  }
  
  // Function to update quantity when plus/minus buttons are clicked
  updateCartQuantity(button: HTMLElement, change: number): void {
    const input = change === -1 
      ? button.nextElementSibling as HTMLInputElement
      : button.previousElementSibling as HTMLInputElement;
    
    // Get current value
    let value = parseInt(input.value);
    
    // Apply change with constraints
    value += change;
    if (value < 1) value = 1;
    if (value > 50) value = 50;
    
    // Update input value
    input.value = value.toString();
    
    // Calculate new total
    (window as any).updateCartTotal();
  }
  
  // Function to calculate total price from all cart items
  updateCartTotal(): void {
    const inputs = document.querySelectorAll('.quantity-input') as NodeListOf<HTMLInputElement>;
    let total = 0;
    
    inputs.forEach(input => {
      const price = parseInt(input.getAttribute('data-price') || '0');
      const quantity = parseInt(input.value);
      total += price * quantity;
    });
    
    // Format the total price
    const formattedTotal = total.toLocaleString('vi-VN') + '₫';
    
    // Update the total display
    const totalElement = document.getElementById('cartTotalPrice');
    if (totalElement) {
      totalElement.textContent = formattedTotal;
    }
  }
}
