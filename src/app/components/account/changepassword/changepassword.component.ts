import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../service/user.service';
import { TokenService } from '../../../service/token.service';
import { Router } from '@angular/router';
import { UpdateUserDTO } from '../../../dtos/user/update.user.dto';

@Component({
  selector: 'app-changepassword',
  standalone: false,
  templateUrl: './changepassword.component.html',
  styleUrl: './changepassword.component.scss'
})
export class ChangepasswordComponent implements OnInit {
  changePasswordForm!: FormGroup;
  formSubmitted = false;
  passwordMismatch = false;
  passwordChangeSuccess = false;
  passwordChangeError = false;
  errorMessage = '';
  isLoading = false;
  user: any = null;
  showNewPassword = false;
  showConfirmPassword = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkAuthentication();
  }

  checkAuthentication(): void {
    const token = this.tokenService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Get user data from localStorage
    this.user = this.userService.getUserResponseFromLocalStorage();
    if (!this.user) {
      this.userService.getUserDetail(token).subscribe({
        next: (response: any) => {
          this.user = response;
          this.userService.saveUserResponseToLocalStorage(response);
        },
        error: (error) => {
          console.error('Error getting user details:', error);
          if (error.status === 401) {
            this.tokenService.removeToken();
            this.userService.removeUserFromLocalStorage();
            this.router.navigate(['/login']);
          }
        }
      });
    }
  }

  initForm(): void {
    this.changePasswordForm = this.formBuilder.group({
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  // Getter methods for form controls
  get newPassword() { return this.changePasswordForm.get('newPassword'); }
  get confirmPassword() { return this.changePasswordForm.get('confirmPassword'); }

  onSubmit(): void {
    this.formSubmitted = true;
    this.passwordMismatch = false;
    this.passwordChangeSuccess = false;
    this.passwordChangeError = false;

    // Check if form is valid
    if (this.changePasswordForm.invalid) {
      return;
    }

    // Check if passwords match
    if (this.newPassword!.value !== this.confirmPassword!.value) {
      this.passwordMismatch = true;
      return;
    }

    // Get token
    const token = this.tokenService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    // Create UpdateUserDTO with existing user data from localStorage
    // and new password values
    const userData = this.userService.getUserResponseFromLocalStorage();
    if (!userData) {
      this.passwordChangeError = true;
      this.errorMessage = 'Không thể lấy dữ liệu người dùng. Vui lòng đăng nhập lại.';
      return;
    }

    const updateUserDTO: UpdateUserDTO = {
      full_name: userData.full_name || '',
      address: userData.address || '',
      date_of_birth: userData.date_of_birth || new Date(),
      password: this.newPassword!.value,
      retype_password: this.confirmPassword!.value
    };

    this.isLoading = true;
    // Call the updateUserDetail method
    this.userService.updateUserDetail(token, updateUserDTO).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.passwordChangeSuccess = true;
        this.changePasswordForm.reset();
        this.formSubmitted = false;
        
        // Optionally update the stored user data
        if (response) {
          this.userService.saveUserResponseToLocalStorage(response);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.passwordChangeError = true;
        console.error('Error updating password:', error);
        
        if (error.status === 401) {
          this.errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
          this.tokenService.removeToken();
          this.userService.removeUserFromLocalStorage();
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Đã xảy ra lỗi khi cập nhật mật khẩu. Vui lòng thử lại sau.';
        }
      }
    });
  }

  // Password validation methods
  hasMinLength(): boolean {
    return this.newPassword?.value && this.newPassword.value.length >= 8;
  }

  hasUpperLowerCase(): boolean {
    return this.newPassword?.value && 
           /[A-Z]/.test(this.newPassword.value) && 
           /[a-z]/.test(this.newPassword.value);
  }

  hasNumber(): boolean {
    return this.newPassword?.value && /\d/.test(this.newPassword.value);
  }

  hasNoWhitespace(): boolean {
    return this.newPassword?.value && !/\s/.test(this.newPassword.value);
  }
  
  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  
  logout(): void {
    this.tokenService.removeToken();
    this.userService.removeUserFromLocalStorage();
    this.router.navigate(['/login']);
  }
}
