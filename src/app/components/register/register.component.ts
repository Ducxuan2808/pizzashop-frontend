import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../service/user.service';
import { RegisterDTO } from '../../dtos/user/register.dto';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  providers: [MessageService]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isSubmitting = false;
  showPassword = false;
  showRetypePassword = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.registerForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      password: ['', [Validators.required, this.passwordValidator]],
      retype_password: ['', [Validators.required]],
      agree_terms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
  }

  // Custom validator for password requirements
  passwordValidator(control: any) {
    const password = control.value;
    if (!password) {
      return null; // Let required validator handle empty values
    }

    const errors: any = {};

    // Check minimum length (8 characters)
    if (password.length < 8) {
      errors.minLength = true;
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.noUppercase = true;
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.noLowercase = true;
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      errors.noNumber = true;
    }

    // Check for no whitespace
    if (/\s/.test(password)) {
      errors.hasWhitespace = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const retypePassword = form.get('retype_password')?.value;
    
    if (password && retypePassword && password !== retypePassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const formValues = this.registerForm.value;

    // Create RegisterDTO
    const registerDTO = new RegisterDTO({
      full_name: formValues.full_name,
      email: formValues.email,
      phone: formValues.phone,
      password: formValues.password,
      retype_password: formValues.retype_password,
      address: '', // Default empty address
      date_of_birth: new Date(), // Default current date
      role_id: 1 // Default user role
    });

    // Call register API
    this.userService.register(registerDTO).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        
        // Show success message
        this.messageService.add({
          severity: 'success',
          summary: 'Đăng ký thành công',
          detail: 'Tài khoản của bạn đã được tạo thành công. Vui lòng đăng nhập.',
          life: 5000
        });

        // Navigate to login page after a short delay
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);

        this.isSubmitting = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Registration failed:', error);
        
        let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 400) {
          errorMessage = 'Thông tin đăng ký không hợp lệ.';
        } else if (error.status === 409) {
          errorMessage = 'Email hoặc số điện thoại đã được sử dụng.';
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Đăng ký thất bại',
          detail: errorMessage,
          life: 5000
        });

        this.isSubmitting = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for template
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.registerForm.get(fieldName);
    if (errorType) {
      return !!(field?.errors?.[errorType] && field?.touched);
    }
    return !!(field?.errors && field?.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field?.errors) return '';

    if (field.errors['required']) {
      return `${this.getFieldDisplayName(fieldName)} không được để trống`;
    }
    if (field.errors['email']) {
      return 'Email không hợp lệ';
    }
    if (field.errors['minlength']) {
      const requiredLength = field.errors['minlength'].requiredLength;
      return `${this.getFieldDisplayName(fieldName)} phải có ít nhất ${requiredLength} ký tự`;
    }
    if (field.errors['pattern']) {
      if (fieldName === 'phone') {
        return 'Số điện thoại không hợp lệ (10-11 số)';
      }
    }
    
    // Password validation errors
    if (fieldName === 'password') {
      if (field.errors['minLength']) {
        return 'Mật khẩu phải có ít nhất 8 ký tự';
      }
      if (field.errors['noUppercase']) {
        return 'Mật khẩu phải bao gồm ít nhất 1 chữ hoa';
      }
      if (field.errors['noLowercase']) {
        return 'Mật khẩu phải bao gồm ít nhất 1 chữ thường';
      }
      if (field.errors['noNumber']) {
        return 'Mật khẩu phải bao gồm ít nhất 1 số';
      }
      if (field.errors['hasWhitespace']) {
        return 'Mật khẩu không được chứa khoảng trắng';
      }
    }
    
    if (fieldName === 'retype_password' && this.registerForm.errors?.['passwordMismatch']) {
      return 'Mật khẩu xác nhận không khớp';
    }
    if (field.errors['requiredTrue']) {
      return 'Bạn cần đồng ý với điều khoản sử dụng';
    }

    return 'Trường này không hợp lệ';
  }

  private getFieldDisplayName(fieldName: string): string {
    const names: { [key: string]: string } = {
      'full_name': 'Họ và tên',
      'email': 'Email',
      'phone': 'Số điện thoại',
      'password': 'Mật khẩu',
      'retype_password': 'Xác nhận mật khẩu'
    };
    return names[fieldName] || fieldName;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleRetypePasswordVisibility(): void {
    this.showRetypePassword = !this.showRetypePassword;
  }
}
