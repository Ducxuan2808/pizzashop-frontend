import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Address {
  id: number;
  recipientName: string;
  phone: string;
  fullAddress: string; // Đã gộp các trường địa chỉ thành một
  isDefault: boolean;
}

interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: User = {
    id: 1,
    fullName: 'Xuan Nguyen',
    email: 'xuannguyen@example.com',
    phone: '0123456789'
  };

  addresses: Address[] = [
    {
      id: 1,
      recipientName: 'Xuan Nguyen',
      phone: '0123456789',
      fullAddress: '70 Lữ Gia, Phường 15, Quận 11, TP.HCM',
      isDefault: true
    }
  ];

  profileForm!: FormGroup;
  showAlert: boolean = false;
  alertType: 'success' | 'error' = 'success';
  alertMessage: string = '';
  
  // Popup state
  showAddressPopup: boolean = false;
  editingAddressIndex: number = -1;
  addressForm!: FormGroup;
  
  // Lists for address form
  cities: string[] = ['TP.HCM', 'Hà Nội', 'Đà Nẵng'];
  districts: { [key: string]: string[] } = {
    'TP.HCM': ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 11'],
    'Hà Nội': ['Ba Đình', 'Hoàn Kiếm', 'Hai Bà Trưng'],
    'Đà Nẵng': ['Hải Châu', 'Thanh Khê', 'Liên Chiểu']
  };
  wards: { [key: string]: { [key: string]: string[] } } = {
    'TP.HCM': {
      'Quận 1': ['Phường Bến Nghé', 'Phường Bến Thành'],
      'Quận 11': ['Phường 1', 'Phường 15']
    },
    'Hà Nội': {
      'Ba Đình': ['Phường Phúc Xá', 'Phường Trúc Bạch'],
      'Hoàn Kiếm': ['Phường Hàng Bạc', 'Phường Hàng Bồ']
    }
  };

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initForm();
    this.initAddressForm();
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      fullName: [this.user.fullName, [Validators.required]],
      email: [this.user.email, [Validators.required, Validators.email]],
      phone: [{ value: this.user.phone, disabled: true }] // Phone input is disabled
    });
  }
  
  initAddressForm(address?: Address): void {
    const defaultAddress = address || {
      id: 0,
      recipientName: this.user.fullName,
      phone: this.user.phone,
      fullAddress: '',
      isDefault: false
    };
    
    this.addressForm = this.fb.group({
      recipientName: [defaultAddress.recipientName, [Validators.required]],
      phone: [defaultAddress.phone, [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      fullAddress: [defaultAddress.fullAddress, [Validators.required]],
      isDefault: [defaultAddress.isDefault]
    });
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      const updatedUser = {
        ...this.user,
        fullName: this.profileForm.value.fullName,
        email: this.profileForm.value.email // Now updating email
      };

      // Simulate API call
      setTimeout(() => {
        this.user = updatedUser;
        this.showAlertMessage('success', 'Thông tin tài khoản đã được cập nhật thành công!');
      }, 500);
    } else {
      this.profileForm.markAllAsTouched();
      this.showAlertMessage('error', 'Vui lòng kiểm tra lại thông tin!');
    }
  }
  
  openAddressPopup(index: number): void {
    this.editingAddressIndex = index;
    this.initAddressForm(this.addresses[index]);
    this.showAddressPopup = true;
  }
  
  closeAddressPopup(): void {
    this.showAddressPopup = false;
    this.editingAddressIndex = -1;
  }
  
  saveAddress(): void {
    if (this.addressForm.valid) {
      const formValue = this.addressForm.value;
      
      // If setting as default, update other addresses
      if (formValue.isDefault) {
        this.addresses.forEach(a => a.isDefault = false);
      }
      
      // Update the address
      const updatedAddress: Address = {
        ...this.addresses[this.editingAddressIndex],
        recipientName: formValue.recipientName,
        phone: formValue.phone,
        fullAddress: formValue.fullAddress,
        isDefault: formValue.isDefault
      };
      
      this.addresses[this.editingAddressIndex] = updatedAddress;
      
      // Close popup and show success message
      this.closeAddressPopup();
      this.showAlertMessage('success', 'Địa chỉ đã được cập nhật thành công!');
    } else {
      this.addressForm.markAllAsTouched();
    }
  }
  
  getAvailableDistricts(): string[] {
    const city = this.addressForm.get('city')?.value;
    return city ? this.districts[city] || [] : [];
  }
  
  getAvailableWards(): string[] {
    const city = this.addressForm.get('city')?.value;
    const district = this.addressForm.get('district')?.value;
    
    if (city && district && this.wards[city] && this.wards[city][district]) {
      return this.wards[city][district];
    }
    return [];
  }

  showAlertMessage(type: 'success' | 'error', message: string): void {
    this.alertType = type;
    this.alertMessage = message;
    this.showAlert = true;

    // Auto close alert after 3 seconds
    setTimeout(() => {
      this.closeAlert();
    }, 3000);
  }

  closeAlert(): void {
    this.showAlert = false;
  }
}
