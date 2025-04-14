import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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
  
  constructor(private formBuilder: FormBuilder) {
    this.initForm();
  }

  ngOnInit(): void {
    // Form is already initialized in the constructor
  }

  initForm(): void {
    this.changePasswordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  // Getter methods for form controls
  get currentPassword() { return this.changePasswordForm.get('currentPassword'); }
  get newPassword() { return this.changePasswordForm.get('newPassword'); }
  get confirmPassword() { return this.changePasswordForm.get('confirmPassword'); }

  onSubmit(): void {
    this.formSubmitted = true;
    this.passwordMismatch = false;
    this.passwordChangeSuccess = false;

    // Check if form is valid
    if (this.changePasswordForm.invalid) {
      return;
    }

    // Check if passwords match
    if (this.newPassword!.value !== this.confirmPassword!.value) {
      this.passwordMismatch = true;
      return;
    }

    // Submit change password request to API
    // In a real application, you would call a service to update the password
    // For demo purposes, we'll just simulate a successful password change
    setTimeout(() => {
      this.passwordChangeSuccess = true;
      this.changePasswordForm.reset();
      this.formSubmitted = false;
    }, 1000);
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
}
