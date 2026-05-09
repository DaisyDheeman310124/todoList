import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoaderService } from './auth.interceptor';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Global Loader -->
    @if (loader.isLoading()) {
      <div class="loader-overlay">
        <div class="spinner"></div>
      </div>
    }

    <!-- Toast Notifications -->
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class.error]="toast.type === 'error'">
          {{ toast.message }}
        </div>
      }
    </div>

    <router-outlet></router-outlet>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .toast {
      padding: 12px 24px;
      background: #10b981;
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      animation: slideIn 0.3s ease;
    }
    .toast.error { background: #ef4444; }
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
  `]
})
export class App {
  loader = inject(LoaderService);
  toastService = inject(ToastService);
}
