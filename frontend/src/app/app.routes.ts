import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';
import { ForgotPasswordComponent } from './features/forgot-password/forgot-password.component';
import { TodoComponent } from './features/todo/todo.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'todo', component: TodoComponent, canActivate: [authGuard] },
  { 
    path: '', 
    redirectTo: localStorage.getItem('token') ? '/todo' : '/login', 
    pathMatch: 'full' 
  },
  { path: '**', redirectTo: '/login' }
];
