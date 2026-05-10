import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';
import { Task } from '../../shared/models/task.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.css'
})
export class TodoComponent implements OnInit {
  taskForm: FormGroup;
  tasks = signal<Task[]>([]);
  users = signal<any[]>([]);
  searchQuery = signal('');
  userEmail = signal('');
  selectedUserId = signal('');
  editingId: string | null = null;
  showAddForm = signal(false);
  showAdminPanel = signal(false);

  // Admin Pagination & Search States
  adminSearchQuery = signal('');
  adminCurrentPage = signal(0);
  adminPageSize = 5;

  // Custom Modal States
  showConfirmModal = signal(false);
  confirmTitle = signal('');
  confirmMessage = signal('');
  confirmActionType = signal<'logout' | 'deleteTask' | 'deleteUser' | null>(null);
  pendingId: string | null = null;
  
  isAdmin = computed(() => this.userEmail() === 'amitkumar310124@gmail.com');

  // Logic for Admin User Filtering & Pagination
  filteredUsers = computed(() => {
    const query = this.adminSearchQuery().toLowerCase();
    return this.users().filter(u => u.email.toLowerCase().includes(query));
  });

  paginatedUsers = computed(() => {
    const start = this.adminCurrentPage() * this.adminPageSize;
    return this.filteredUsers().slice(start, start + this.adminPageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredUsers().length / this.adminPageSize));

  displayName = computed(() => {
    const email = this.userEmail();
    if (!email) return 'User';
    let namePart = email.split('@')[0];
    return namePart
      .replace(/[0-9]/g, '')
      .split(/[._-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  });

  toast = inject(ToastService);
  fb = inject(FormBuilder);

  constructor(private taskService: TaskService, private router: Router) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      priority: ['medium']
    });
  }

  ngOnInit() {
    this.userEmail.set(localStorage.getItem('userEmail') || '');
    this.loadTasks();
    if (this.isAdmin()) {
      this.loadUsers();
      this.showAdminPanel.set(true);
    }
  }

  loadTasks() {
    this.taskService.getTasks(this.selectedUserId()).subscribe({
      next: (tasks) => this.tasks.set(tasks),
      error: () => this.toast.show('Failed to load tasks', 'error')
    });
  }

  loadUsers() {
    this.taskService.getUsers().subscribe({
      next: (users) => this.users.set(users),
      error: () => this.toast.show('Failed to load users', 'error')
    });
  }

  onUserChange(userId: string) {
    this.selectedUserId.set(userId);
    this.loadTasks();
  }

  getTasksByStatus(status: 'todo' | 'in-progress' | 'done'): Task[] {
    const query = this.searchQuery().toLowerCase();
    return this.tasks().filter(t => {
      const taskStatus = t.status || 'todo';
      return taskStatus === status && 
      (t.title.toLowerCase().includes(query) || t.description?.toLowerCase().includes(query));
    });
  }

  onSearchChange(query: any) {
    this.searchQuery.set(query);
  }

  saveTask() {
    if (this.taskForm.invalid) return;
    const taskData = { ...this.taskForm.value, status: 'todo' };

    const apiCall = this.editingId 
      ? this.taskService.updateTask({ ...taskData, _id: this.editingId })
      : this.taskService.addTask(taskData);

    apiCall.subscribe({
      next: () => { 
        this.toast.show(this.editingId ? 'Task updated!' : 'Task added!');
        this.resetForm(); 
        this.loadTasks(); 
        this.showAddForm.set(false);
      },
      error: () => this.toast.show('Operation failed', 'error')
    });
  }

  updateStatus(task: Task, newStatus: 'todo' | 'in-progress' | 'done') {
    this.taskService.updateTask({ ...task, status: newStatus }).subscribe({
      next: () => this.loadTasks(),
      error: () => this.toast.show('Failed to move task', 'error')
    });
  }

  // Admin Controls
  onAdminSearch(query: any) {
    this.adminSearchQuery.set(query);
    this.adminCurrentPage.set(0); // Reset to first page on search
  }

  nextPage() {
    if (this.adminCurrentPage() < this.totalPages() - 1) {
      this.adminCurrentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.adminCurrentPage() > 0) {
      this.adminCurrentPage.update(p => p - 1);
    }
  }

  triggerConfirm(type: 'logout' | 'deleteTask' | 'deleteUser', id?: string) {
    this.confirmActionType.set(type);
    this.pendingId = id || null;

    if (type === 'logout') {
      this.confirmTitle.set('Logout Confirmation');
      this.confirmMessage.set('Are you sure you want to log out of TaskMinder?');
    } else if (type === 'deleteTask') {
      this.confirmTitle.set('Delete Task');
      this.confirmMessage.set('This task will be permanently removed. Continue?');
    } else if (type === 'deleteUser') {
      this.confirmTitle.set('Remove User Account');
      this.confirmMessage.set('All user data and tasks will be deleted forever. Are you sure?');
    }
    this.showConfirmModal.set(true);
  }

  onConfirmAction() {
    const type = this.confirmActionType();
    this.showConfirmModal.set(false);

    if (type === 'logout') {
      this.taskService.logout();
      this.router.navigate(['/login']);
    } else if (type === 'deleteTask' && this.pendingId) {
      this.taskService.deleteTask(this.pendingId).subscribe({
        next: () => { this.toast.show('Task deleted'); this.loadTasks(); },
        error: () => this.toast.show('Delete failed', 'error')
      });
    } else if (type === 'deleteUser' && this.pendingId) {
      this.taskService.deleteUser(this.pendingId).subscribe({
        next: () => { 
          this.toast.show('User deleted'); 
          this.loadUsers();
          if (this.selectedUserId() === this.pendingId) {
            this.selectedUserId.set('');
            this.loadTasks();
          }
        },
        error: () => this.toast.show('Failed to delete user', 'error')
      });
    }
  }

  editTask(task: Task) {
    this.editingId = task._id!;
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      priority: task.priority || 'medium'
    });
    this.showAddForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  blockUser(userId: string) {
    this.taskService.blockUser(userId).subscribe({
      next: (res) => { this.toast.show(res.message); this.loadUsers(); },
      error: () => this.toast.show('Failed to update user status', 'error')
    });
  }

  resetForm() {
    this.taskForm.reset({ priority: 'medium' });
    this.editingId = null;
  }
}
