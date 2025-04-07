import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  activeNavItem = 0;
  navItems = [
    { label: 'Trang chủ', link: '/' },
    { label: 'Giới thiệu', link: '/about' },
    { label: 'Sản phẩm', link: '/products' },
    { label: 'Tin tức', link: '/news' },
    { label: 'Câu hỏi thường gặp', link: '/faq' },
    { label: 'Liên hệ', link: '/contact' },
  ];

  setActiveNavItem(index: number) {
    this.activeNavItem = index;
  }

}
