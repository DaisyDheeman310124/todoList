import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../login/login.component.css'
})
export class ForgotPasswordComponent {
  emailForm: FormGroup;
  resetForm: FormGroup;
  step = 1;
  question = '';
  showPassword = false;

  fb = inject(FormBuilder);
  taskService = inject(TaskService);
  toast = inject(ToastService);
  router = inject(Router);

  constructor() {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      answer: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  getQuestion() {
    if (this.emailForm.invalid) return;
    
    const email = this.emailForm.value.email;
    this.taskService.getSecurityQuestion(email).subscribe({
      next: (res) => {
        this.question = res.question;
        this.step = 2;
      },
      error: (err) => {
        this.toast.show(err.error?.message || 'Failed to find account', 'error');
      }
    });
  }

  resetPassword() {
    if (this.resetForm.invalid) return;

    const data = {
      email: this.emailForm.value.email,
      ...this.resetForm.value
    };

    this.taskService.resetPassword(data).subscribe({
      next: () => {
        this.toast.show('Password reset successful! Please login.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.toast.show(err.error?.message || 'Reset failed', 'error');
      }
    });
  }
}
