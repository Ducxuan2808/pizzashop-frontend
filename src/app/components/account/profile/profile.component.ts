import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../service/user.service';
import { TokenService } from '../../../service/token.service';
import { Router } from '@angular/router';
import { User } from '../../../model/user';
import { UpdateUserDTO } from '../../../dtos/user/update.user.dto';
import { MembershipService } from '../../../service/membership.service';
import { Membership } from '../../../model/membership';

interface Address {
  id: number;
  recipientName: string;
  phone: string;
  fullAddress: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: any = null;
  addresses: Address[] = [];
  profileForm!: FormGroup;
  showAlert: boolean = false;
  alertType: 'success' | 'error' = 'success';
  alertMessage: string = '';
  isLoading: boolean = true;
  
  // Add membership data
  membership: Membership | null = null;
  isMembershipLoading: boolean = true;
  
  // Popup state
  showAddressPopup: boolean = false;
  editingAddressIndex: number = -1;
  addressForm!: FormGroup;
  
  // Add a property for confirmation dialog
  showConfirmDialog: boolean = false;

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

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private tokenService: TokenService,
    private router: Router,
    private membershipService: MembershipService
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.initAddressForm();
    
    // Load default address if the user has one saved
    this.addresses = [{
      id: 1,
      recipientName: '',
      phone: '',
      fullAddress: '',
      isDefault: true
    }];
  }

  loadUserData(): void {
    this.isLoading = true;
    const token = this.tokenService.getToken();
    
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.user = this.userService.getUserResponseFromLocalStorage();
    
    if (this.user) {
      this.initForm();
      this.isLoading = false;
        // Load membership data
        this.loadMembershipData();
      // If we have an address from the user data, update the addresses array
      if (this.user.address) {
        this.addresses[0].recipientName = this.user.full_name;
        this.addresses[0].phone = this.user.phone;
        this.addresses[0].fullAddress = this.user.address;
      }
      
    
    } else {
      // If user data is not in localStorage, fetch it from the server
      this.userService.getUserDetail(token).subscribe({
        next: (response: any) => {
          this.user = response;
          this.userService.saveUserResponseToLocalStorage(this.user);
          this.initForm();
          
          // If we have an address from the user data, update the addresses array
          if (this.user.address) {
            this.addresses[0].recipientName = this.user.full_name;
            this.addresses[0].phone = this.user.phone;
            this.addresses[0].fullAddress = this.user.address;
          }
          
          this.isLoading = false;
          
          // Load membership data
          this.loadMembershipData();
        },
        error: (error) => {
          console.error('Error fetching user details:', error);
          this.showAlertMessage('error', 'Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
          this.isLoading = false;
          
          if (error.status === 401) {
            this.tokenService.removeToken();
            this.userService.removeUserFromLocalStorage();
            this.router.navigate(['/login']);
          }
        }
      });
    }
  }
  
  loadMembershipData(): void {
    this.isMembershipLoading = true;
    debugger
    
    if (this.user && this.user.phone) {
      this.membershipService.getMembershipByUserPhone(this.user.phone).subscribe({
        next: (response: any) => {
          debugger
          this.membership = response.membership;
          this.isMembershipLoading = false;
        },
        error: (error) => {
          console.error('Error fetching membership data:', error);
          this.isMembershipLoading = false;
        }
      });
    } else {
      this.isMembershipLoading = false;
    }
  }

  // Format currency method for displaying total spent
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      fullName: [this.user?.full_name || '', [Validators.required]],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      phone: [this.user?.phone || '', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      address: [this.user?.address || '', [Validators.required]]
    });
  }
  
  initAddressForm(address?: Address): void {
    const defaultAddress = address || {
      id: 0,
      recipientName: this.user?.full_name || '',
      phone: this.user?.phone || '',
      fullAddress: this.user?.address || '',
      isDefault: true
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
      // Show confirmation dialog
      this.showConfirmDialog = true;
    } else {
      this.profileForm.markAllAsTouched();
      this.showAlertMessage('error', 'Vui lòng kiểm tra lại thông tin!');
    }
  }

  // Method to actually submit the update after confirmation
  confirmUpdate(): void {
    const token = this.tokenService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Get existing user data from localStorage
    const existingUser = this.userService.getUserResponseFromLocalStorage();
    
    // Create updateUserDTO with data from the form and existing data from localStorage
    const updateUserDTO: UpdateUserDTO = {
      full_name: this.profileForm.value.fullName,
      address: this.profileForm.value.address,
      date_of_birth: existingUser?.date_of_birth || new Date(),
      password: '', // Not updating password here
      retype_password: '' // Not updating password here
    };

    this.userService.updateUserDetail(token, updateUserDTO).subscribe({
      next: (response: any) => {
        // Update the local user object
        this.user = {
          ...existingUser,
          full_name: updateUserDTO.full_name,
          address: updateUserDTO.address
        };
        
        // Update the addresses array with the new address
        if (this.addresses.length > 0) {
          this.addresses[0].recipientName = this.user.full_name;
          this.addresses[0].phone = this.user.phone;
          this.addresses[0].fullAddress = updateUserDTO.address;
        }
        
        // Save updated user to localStorage
        this.userService.saveUserResponseToLocalStorage(this.user);
        
        // Hide confirmation dialog
        this.showConfirmDialog = false;
        
        this.showAlertMessage('success', 'Thông tin tài khoản đã được cập nhật thành công!');
      },
      error: (error) => {
        console.error('Error updating user details:', error);
        this.showAlertMessage('error', 'Không thể cập nhật thông tin. Vui lòng thử lại sau.');
        
        // Hide confirmation dialog
        this.showConfirmDialog = false;
        
        if (error.status === 401) {
          this.tokenService.removeToken();
          this.userService.removeUserFromLocalStorage();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  // Method to cancel update
  cancelUpdate(): void {
    this.showConfirmDialog = false;
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
      
      // Update user address in profile
      const token = this.tokenService.getToken();
      if (token && formValue.isDefault) {
        const updateUserDTO: UpdateUserDTO = {
          full_name: this.user.full_name,
          address: formValue.fullAddress,
          date_of_birth: this.user.date_of_birth || new Date(),
          password: '', // Not updating password here
          retype_password: '' // Not updating password here
        };
        
        this.userService.updateUserDetail(token, updateUserDTO).subscribe({
          next: (response: any) => {
            // Update local user data
            this.user = {
              ...this.user,
              address: formValue.fullAddress
            };
            
            // Save to localStorage
            this.userService.saveUserResponseToLocalStorage(this.user);
            
            // Close popup and show success message
            this.closeAddressPopup();
            this.showAlertMessage('success', 'Địa chỉ đã được cập nhật thành công!');
          },
          error: (error) => {
            console.error('Error updating address:', error);
            this.showAlertMessage('error', 'Không thể cập nhật địa chỉ. Vui lòng thử lại sau.');
            
            if (error.status === 401) {
              this.tokenService.removeToken();
              this.userService.removeUserFromLocalStorage();
              this.router.navigate(['/login']);
            }
          }
        });
      } else {
        // Close popup and show success message
        this.closeAddressPopup();
        this.showAlertMessage('success', 'Địa chỉ đã được cập nhật thành công!');
      }
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
  
  logout(): void {
    // Remove token
    this.tokenService.removeToken();
    // Remove user data
    this.userService.removeUserFromLocalStorage();
    // Navigate to login page
    this.router.navigate(['/login']);
  }
}
