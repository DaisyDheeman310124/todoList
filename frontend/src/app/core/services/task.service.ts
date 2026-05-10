import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../../shared/models/task.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = environment.apiUrl; 

  constructor(private http: HttpClient) { }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, userData);
  }

  getSecurityQuestion(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password/question`, { email });
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password/reset`, data);
  }

  // Admin User Management
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/users`);
  }

  blockUser(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/users/${id}/block`, {});
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${id}`);
  }

  // Tasks
  getTasks(userId?: string): Observable<Task[]> {
    const url = userId ? `${this.apiUrl}/tasks?userId=${userId}` : `${this.apiUrl}/tasks`;
    return this.http.get<Task[]>(url);
  }

  addTask(task: Task): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, task);
  }

  updateTask(task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${task._id}`, task);
  }

  deleteTask(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/${id}`);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  isAdmin(): boolean {
    return localStorage.getItem('userEmail') === 'amitkumar310124@gmail.com';
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
  }
}
