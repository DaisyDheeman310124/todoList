import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TaskService } from '../services/task.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  showTerms = false;
  
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  fb = inject(FormBuilder);
  taskService = inject(TaskService);
  toast = inject(ToastService);
  router = inject(Router);

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      securityQuestion: ['', Validators.required],
      securityAnswer: ['', Validators.required],
      termsAccepted: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update(v => !v);
  }

  register() {
    if (this.registerForm.invalid) {
      this.toast.show('Please fill the form correctly', 'error');
      return;
    }

    this.taskService.register(this.registerForm.value).subscribe({
      next: () => {
        this.toast.show('Registration Successful! Please login.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.toast.show(err.error?.message || 'Registration failed', 'error');
      }
    });
  }

  get f() { return this.registerForm.controls; }
}
