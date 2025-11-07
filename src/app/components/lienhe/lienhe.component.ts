import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-lienhe',
  standalone: false,
  templateUrl: './lienhe.component.html',
  styleUrl: './lienhe.component.scss'
})
export class LienheComponent implements OnInit {
  contactForm!: FormGroup;
  submitted = false;
  submitSuccess = false;

  constructor(
    private formBuilder: FormBuilder,
    private titleService: Title
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle('Liên Hệ - PizZing pizza');
    this.initForm();
  }

  initForm(): void {
    this.contactForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      address: [''],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  // Getter for easy access to form fields
  get f() {
    return this.contactForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;

    // stop here if form is invalid
    if (this.contactForm.invalid) {
      return;
    }

    // In a real application, you would send the form data to your server here
    console.log('Form submitted with values:', this.contactForm.value);
    
    // Simulate API call
    setTimeout(() => {
      this.submitSuccess = true;
      this.submitted = false;
      this.contactForm.reset();
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        this.submitSuccess = false;
      }, 5000);
    }, 1500);
  }
}
