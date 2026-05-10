import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = signal(false);
  
  fb = inject(FormBuilder);
  taskService = inject(TaskService);
  toast = inject(ToastService);
  router = inject(Router);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.toast.show('Please fix the errors in the form', 'error');
      return;
    }

    this.isLoading.set(true);
    this.taskService.login(this.loginForm.value).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('userEmail', res.email);
        this.toast.show('Welcome back to TaskMinder!');
        this.router.navigate(['/todo']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.show(err.error?.message || 'Login failed', 'error');
      }
    });
  }

  get f() { return this.loginForm.controls; }
}
