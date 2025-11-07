import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TokenService } from '../../../service/token.service';
import { UserService } from '../../../service/user.service';

@Component({
  selector: 'app-admin-header',
  standalone: false,
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.scss'
})
export class AdminHeaderComponent implements OnInit {
  activeMenu: string = 'dashboard';
  sidebarVisible: boolean = true;
  userName: string = 'Admin';
  userEmail: string = '';
  userFirstLetter: string = 'A';

  constructor(
    private router: Router,
    private tokenService: TokenService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Get user info from localStorage
    this.getUserInfoFromLocalStorage();

    // Tự động xác định menu active dựa trên URL hiện tại
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      
      if (url.includes('/admin/dashboard')) {
        this.activeMenu = 'dashboard';
      } else if (url.includes('/admin/orders')) {
        this.activeMenu = 'orders';
      } else if (url.includes('/admin/bookings')) {
        this.activeMenu = 'bookings';
      } else if (url.includes('/admin/sizes')) {
        this.activeMenu = 'sizes';
      } else if (url.includes('/admin/types')) {
        this.activeMenu = 'types';
      } else if (url.includes('/admin/pizzas')) {
        this.activeMenu = 'pizzas';
      } else if (url.includes('/admin/users')) {
        this.activeMenu = 'users';
      } else if (url.includes('/admin/statistics')) {
        this.activeMenu = 'statistics';
      }
    });

    // Kiểm tra kích thước màn hình để thiết lập trạng thái sidebar
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  // Get user information from localStorage
  getUserInfoFromLocalStorage(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.full_name) {
          this.userName = user.full_name;
          this.userFirstLetter = user.full_name.charAt(0).toUpperCase();
        } else if (user.username) {
          this.userName = user.username;
          this.userFirstLetter = user.username.charAt(0).toUpperCase();
        }
        
        if (user.email) {
          this.userEmail = user.email;
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
  }

  // Logout functionality
  logout(): void {
    // Remove token
    this.tokenService.removeToken();
    // Remove user data
    this.userService.removeUserFromLocalStorage();
    // Navigate to login page
    this.router.navigate(['/login']);
  }

  // Set active menu
  setActiveMenu(menu: string): void {
    this.activeMenu = menu;
  }

  // Toggle sidebar visibility
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

  // Check screen size and adjust sidebar visibility
  private checkScreenSize(): void {
    const width = window.innerWidth;
    if (width < 992) {
      this.sidebarVisible = false;
    } else {
      this.sidebarVisible = true;
    }
  }
}
