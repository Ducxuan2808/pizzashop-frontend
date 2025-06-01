import { Component } from '@angular/core';
import { LoginDTO } from '../../dtos/user/login.dto';
import { UserService } from '../../service/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenService } from '../../service/token.service';
import { RoleService } from '../../service/role.service';
import { UserResponse } from '../../responses/user/user.response';
import { MessageService } from 'primeng/api';
import { CartService } from '../../service/cart.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  providers: [MessageService]
})
export class LoginComponent {
  phone: string = '';
  password: string = '';
  errorMessage: string = '';
  rememberMe: boolean = false;
  userResponse?: UserResponse
  showPassword = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private tokenService: TokenService,
    private roleService: RoleService,
    private activatedRoute: ActivatedRoute,
    private messageService: MessageService,
    private cartService: CartService
  ) {}

  login() {
    this.errorMessage = '';
    
    // Validate input fields
    if (!this.phone || !this.password) {
      this.errorMessage = 'Vui lòng nhập số điện thoại và mật khẩu';
      return;
    }
    
    // Create login DTO
    const loginDTO = new LoginDTO({
      phone: this.phone,
      password: this.password
    });

    // Call login API
    this.userService.login(loginDTO).subscribe({
      next: (response) => {
        debugger
        const {token} = response;
        // Save user info to local storage
        this.tokenService.setToken(token);

        this.userService.getUserDetail(token).subscribe({
          next:(response:any)=>{
            debugger
            this.userResponse={
              ...response,
              date_of_birth: new Date(response.date_of_birth),
            };
            this.userService.saveUserResponseToLocalStorage(this.userResponse);
            
            // Merge guest cart with user cart after successful login
            this.cartService.mergeGuestCartWithUserCart();
            
            debugger
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Đăng nhập thành công!',
              life: 3000
            });
            if(this.userResponse?.role_id.role_name=='admin'){
              debugger
              this.router.navigate(['/admin/orders']);
              
            }
            else if(this.userResponse?.role_id.role_name=='staff'){
              debugger
              this.router.navigate(['/admin/orders']);
            }
            else if(this.userResponse?.role_id.role_name=='user'){
              debugger
              this.router.navigate(['/']);
            }
            
            

          },
          complete:()=>{
            debugger;
           
          },
          error:(error:any)=>{
            debugger;
            alert(error.error.message);
          }
        })
      },
      error: (error) => {
        console.error('Login error:', error);
        if (error.status === 401) {
          this.errorMessage = 'Số điện thoại hoặc mật khẩu không chính xác';
        } else {
          this.errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
        }
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
