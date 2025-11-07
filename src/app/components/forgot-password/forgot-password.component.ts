import { Component } from '@angular/core';
import { ForgotPasswordDTO } from '../../dtos/user/forgotPassword.dto';
import { UserService } from '../../service/user.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  providers: [MessageService]
})
export class ForgotPasswordComponent {
  email: string = '';
  phone: string = '';
  password: string = '';
  retypePassword: string = '';
  errorMessage: string = '';
  isSubmitting: boolean = false;
  showPassword = false;
  showRetypePassword = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private messageService: MessageService
  ) {}

  validateEmail(): boolean {
    // Kiểm tra format email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.email)) {
      this.errorMessage = 'Email không hợp lệ';
      return false;
    }
    return true;
  }

  validatePassword(): boolean {
    // Kiểm tra ít nhất 8 ký tự
    if (this.password.length < 8) {
      this.errorMessage = 'Mật khẩu phải có ít nhất 8 ký tự';
      return false;
    }
    
    // Kiểm tra có ít nhất 1 chữ hoa
    const hasUpperCase = /[A-Z]/.test(this.password);
    if (!hasUpperCase) {
      this.errorMessage = 'Mật khẩu phải có ít nhất 1 chữ hoa';
      return false;
    }
    
    // Kiểm tra có ít nhất 1 chữ thường
    const hasLowerCase = /[a-z]/.test(this.password);
    if (!hasLowerCase) {
      this.errorMessage = 'Mật khẩu phải có ít nhất 1 chữ thường';
      return false;
    }
    
    // Kiểm tra có ít nhất 1 số
    const hasNumber = /\d/.test(this.password);
    if (!hasNumber) {
      this.errorMessage = 'Mật khẩu phải có ít nhất 1 số';
      return false;
    }
    
    // Kiểm tra không chứa khoảng trắng
    if (/\s/.test(this.password)) {
      this.errorMessage = 'Mật khẩu không được chứa khoảng trắng';
      return false;
    }
    
    return true;
  }

  validateForm(): boolean {
    this.errorMessage = '';
    
    // Kiểm tra các trường bắt buộc
    if (!this.email || !this.phone || !this.password || !this.retypePassword) {
      this.errorMessage = 'Vui lòng nhập đầy đủ thông tin';
      return false;
    }
    
    // Kiểm tra email
    if (!this.validateEmail()) {
      return false;
    }
    
    // Kiểm tra định dạng số điện thoại
    const phonePattern = /^\d{10,11}$/;
    if (!phonePattern.test(this.phone)) {
      this.errorMessage = 'Số điện thoại phải có 10-11 chữ số';
      return false;
    }
    
    // Kiểm tra mật khẩu
    if (!this.validatePassword()) {
      return false;
    }
    
    // Kiểm tra mật khẩu và nhập lại mật khẩu có giống nhau
    if (this.password !== this.retypePassword) {
      this.errorMessage = 'Mật khẩu mới và nhập lại mật khẩu không giống nhau';
      return false;
    }
    
    return true;
  }

  forgotPassword() {
    if (!this.validateForm()) {
      return;
    }
    
    this.isSubmitting = true;
    
    // Tạo DTO để gửi lên server
    const forgotPasswordDTO = new ForgotPasswordDTO({
      email: this.email,
      phone: this.phone,
      password: this.password,
      retype_password: this.retypePassword
    });
    debugger
    // Gọi API forgotPassword
    this.userService.forgotPassword(forgotPasswordDTO).subscribe({
      next: (response) => {
        console.log('Password reset successful:', response);
        debugger
        // Hiển thị thông báo thành công
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Cập nhật mật khẩu thành công! Vui lòng đăng nhập lại.',
          life: 3000
        });
        
        // Chuyển về màn login sau 2 giây
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        debugger
        console.error('Forgot password error:', error);
        this.isSubmitting = false;
        
        if (error.status === 404) {
          this.errorMessage = 'Email hoặc số điện thoại không tồn tại trong hệ thống';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Thông tin không hợp lệ';
        } else {
          this.errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
        }
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleRetypePasswordVisibility(): void {
    this.showRetypePassword = !this.showRetypePassword;
  }
}
