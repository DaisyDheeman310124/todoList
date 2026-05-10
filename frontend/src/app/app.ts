import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoaderService } from './core/interceptors/auth.interceptor';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Global Premium Glassy Loader -->
    @if (loader.isLoading()) {
      <div class="global-loader-overlay">
        <div class="loader-content">
          <div class="premium-spinner"></div>
          <p class="loading-text">TaskMinder Syncing...</p>
        </div>
      </div>
    }

    <!-- Premium Toast Notifications -->
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast animate-slide-in" [class.error]="toast.type === 'error'">
          <span class="icon">{{ toast.type === 'error' ? '❌' : '✅' }}</span>
          {{ toast.message }}
        </div>
      }
    </div>

    <router-outlet></router-outlet>
  `,
  styles: [`
    .global-loader-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(10, 10, 26, 0.7);
      backdrop-filter: blur(15px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    }
    .loader-content { text-align: center; }
    .premium-spinner {
      width: 50px; height: 50px;
      border: 4px solid rgba(255,255,255,0.1);
      border-top: 4px solid #c084fc;
      border-radius: 50%;
      animation: spin 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
      margin: 0 auto 1.5rem;
    }
    .loading-text {
      color: white;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      opacity: 0.8;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .toast-container {
      position: fixed;
      top: 30px; right: 30px;
      z-index: 10001;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .toast {
      padding: 1rem 1.5rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .toast.error { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.3); }
    .animate-slide-in { animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes slideIn {
      from { transform: translateX(100px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class App {
  loader = inject(LoaderService);
  toastService = inject(ToastService);
}
