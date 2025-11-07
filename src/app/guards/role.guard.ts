import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    try {
      // Current route path
      const url = state.url;

      // Get user from localStorage
      const userJson = localStorage.getItem('user');
      
      // If no user in localStorage, treat as regular user
      if (!userJson) {
        // If trying to access admin routes, redirect to login
        if (url.startsWith('/admin')) {
          return this.router.createUrlTree(['/login']);
        }
        // Allow access to non-admin routes
        return true;
      }

      const user = JSON.parse(userJson);
      const role = user?.role_id?.role_name;

      // Role-based access control
      if (role === 'user' && url.startsWith('/admin')) {
        // Users cannot access any admin routes
        return this.router.createUrlTree(['/login']);
      } else if (role === 'staff' && url.startsWith('/admin')) {
        // Staff can only access orders and membership admin routes
        if (
          !url.startsWith('/admin/orders') && 
          !url.startsWith('/admin/membership')
        ) {
          return this.router.createUrlTree(['/login']);
        }
      }
      // Admin can access all routes
      return true;
    } catch (error) {
      console.error('Error in role guard:', error);
      // In case of error, default to user role behavior
      const url = state.url;
      if (url.startsWith('/admin')) {
        return this.router.createUrlTree(['/login']);
      }
      return true;
    }
  }
} 