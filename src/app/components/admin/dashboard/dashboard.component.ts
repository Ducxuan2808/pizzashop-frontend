import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  activeMenu: string = '';
  private destroy$ = new Subject<void>();

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Set document title
    document.title = 'Dashboard - PizZing Admin';
    
    // Lắng nghe sự kiện thay đổi router để cập nhật menu đang active
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      this.updateActiveMenu(event.url);
    });
    
    // Cập nhật activeMenu ban đầu dựa trên URL hiện tại
    this.updateActiveMenu(this.router.url);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Hàm chuyển đến trang tương ứng khi nhấn vào menu
  navigate(route: string): void {
    this.router.navigate([route]);
  }
  
  // Cập nhật menu đang active dựa trên URL
  private updateActiveMenu(url: string): void {
    if (url.includes('/admin/dashboard')) {
      this.activeMenu = 'dashboard';
    } else if (url.includes('/admin/orders')) {
      this.activeMenu = 'orders';
    } else if (url.includes('/admin/tablebooking')) {
      this.activeMenu = 'tablebooking';
    } else if (url.includes('/admin/pizzas')) {
      this.activeMenu = 'pizzas';
    } else if (url.includes('/admin/sizes')) {
      this.activeMenu = 'sizes';
    } else if (url.includes('/admin/types')) {
      this.activeMenu = 'types';
    } else if (url.includes('/admin/users')) {
      this.activeMenu = 'users';
    } else if (url.includes('/admin/membership')) {
      this.activeMenu = 'membership';
    } else if (url.includes('/admin/statistics')) {
      this.activeMenu = 'statistics';
    }
  }
}
