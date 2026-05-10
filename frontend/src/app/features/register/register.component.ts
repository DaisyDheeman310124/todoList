import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  showPassword = false;
  isLoading = signal(false);

  fb = inject(FormBuilder);
  taskService = inject(TaskService);
  toast = inject(ToastService);
  router = inject(Router);

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      securityAnswer: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.toast.show('Please fill all fields correctly', 'error');
      return;
    }

    this.isLoading.set(true);
    const { email, password, securityAnswer } = this.registerForm.value;
    
    this.taskService.register({ email, password, securityAnswer }).subscribe({
      next: () => {
        this.toast.show('Account created! Please log in.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.show(err.error?.message || 'Registration failed', 'error');
      }
    });
  }
}
