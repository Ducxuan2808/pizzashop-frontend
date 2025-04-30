import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { TableBookingService } from '../../service/tablebooking.service';
import { TableBooking } from '../../model/tablebooking';
import { TableBookingDTO } from '../../dtos/tablebooking.dto';

interface Booking {
  id: number;
  date: Date;
  time: string;
  guests: number;
  status: 'Reserved'| 'Cancelled' | 'Completed' | 'Walk-in';
}

@Component({
  selector: 'app-tablebooking',
  standalone: false,
  templateUrl: './tablebooking.component.html',
  styleUrl: './tablebooking.component.scss'
})
export class TablebookingComponent implements OnInit {
  bookingForm: FormGroup;
  submitted = false;
  success = false;
  errorMessage = '';
  successMessage = '';
  bookingHistory: Booking[] = [];
  
  // Time selection options
  hours: number[] = [];
  minutes: string[] = ['00', '15', '30', '45'];
  today = new Date();
  
  constructor(
    private fb: FormBuilder,
    private titleService: Title,
    private tableBookingService: TableBookingService
  ) {
    this.bookingForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
      bookingDate: [this.formatDate(this.today), [Validators.required]],
      bookingHour: ['', [Validators.required]],
      bookingMinute: ['00', [Validators.required]],
      guests: ['2', [Validators.required, Validators.min(1), Validators.max(20)]],
      note: ['']
    });
    
    // Generate hours from opening time (8:00) to closing time (21:00)
    for (let i = 8; i <= 21; i++) {
      this.hours.push(i);
    }
    
    // Sample booking history for demonstration
    this.bookingHistory = [
      {
        id: 1,
        date: new Date(2024, 4, 15),
        time: '18:30',
        guests: 4,
        status: 'Reserved'
      },
      {
        id: 2,
        date: new Date(2024, 4, 28),
        time: '19:00',
        guests: 2,
        status: 'Reserved'
      },
      {
        id: 3,
        date: new Date(2024, 5, 10),
        time: '20:15',
        guests: 6,
        status: 'Reserved'
      }
    ];
  }

  ngOnInit(): void {
    this.titleService.setTitle('Đặt bàn - PizZing pizza');
  }
  
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  onSubmit(): void {
    debugger;
    this.submitted = true;
    this.success = false;
    this.errorMessage = '';
    this.successMessage = '';
    
    if (this.bookingForm.invalid) {
      this.submitted = false;
      return;
    }
    
    const formValues = this.bookingForm.value;
    const bookingTime = `${formValues.bookingHour}:${formValues.bookingMinute}`;
    const bookingDate = new Date(formValues.bookingDate);
    
    // Combine date and time for booking_time
    const dateTime = new Date(
      bookingDate.getFullYear(),
      bookingDate.getMonth(),
      bookingDate.getDate(),
      Number(formValues.bookingHour),
      Number(formValues.bookingMinute)
    );
    
    // Create the booking DTO to send to the API
    const bookingDTO: TableBookingDTO = {
      user_id: 1,
      name: formValues.fullName,
      phone: formValues.phone,
      number_of_people: formValues.guests,
      booking_time: dateTime,
      table_number: 0, // This will be assigned by the server
      status: 'Reserved',
      note: formValues.note || '',
      is_active: true
    };
    
    console.log('Sending booking data to API:', bookingDTO);
    
    // Call the service to create the booking
    this.tableBookingService.createTableBooking(bookingDTO).subscribe({
      next: (response) => {
        console.log('Booking created successfully:', response);
        debugger;
        // Add to booking history
        const newBooking: Booking = {
          id: this.bookingHistory.length + 1,
          date: bookingDate,
          time: bookingTime,
          guests: Number(formValues.guests),
          status: 'Reserved'
        };
        
        this.bookingHistory.unshift(newBooking);
        
        // Create a formatted success message with booking details
        const formattedDate = this.formatDisplayDate(bookingDate);
        this.successMessage = `
          <strong>Đặt bàn thành công!</strong><br>
          Thông tin đặt bàn:<br>
          - Họ tên: ${formValues.fullName}<br>
          - Số điện thoại: ${formValues.phone}<br>
          - Ngày đặt: ${formattedDate}<br>
          - Giờ đặt: ${bookingTime}<br>
          - Số người: ${formValues.guests}<br>
          <br>
          Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.
        `;
        
        this.success = true;
        this.bookingForm.reset({
          bookingMinute: '00',
          guests: '2',
          bookingDate: this.formatDate(this.today)
        });
        
        this.submitted = false;
        
        // Scroll to top to see success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Clear success message after 8 seconds
        setTimeout(() => {
          this.success = false;
          this.successMessage = '';
        }, 8000);
      },
      error: (error) => {
        console.error('Error creating booking:', error);
        this.errorMessage = 'Đã xảy ra lỗi khi đặt bàn. Vui lòng thử lại sau.';
        this.submitted = false;
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    });
  }
  
  // Helper method to get user ID from localStorage
  private getUserIdFromLocalStorage(): number {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || 0;
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
    return 0; // Default value if user is not logged in
  }
  
  getMinDate(): string {
    return this.formatDate(this.today);
  }
  
  getMaxDate(): string {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // Allow booking up to 30 days in advance
    return this.formatDate(maxDate);
  }
  
  formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }
}
