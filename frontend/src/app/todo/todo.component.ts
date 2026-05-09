import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../services/task.service';
import { ToastService } from '../services/toast.service';
import { Task } from '../models/task.model';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule], // FIXED: Added FormsModule here
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
  
  isAdmin = computed(() => this.userEmail() === 'amitkumar310124@gmail.com');

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

  isSelectedUserBlocked = computed(() => {
    const user = this.users().find(u => u._id === this.selectedUserId());
    return user ? user.blocked : false;
  });

  toast = inject(ToastService);
  fb = inject(FormBuilder);

  filteredTasks = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.tasks().filter(t => 
      t.title.toLowerCase().includes(query) || 
      (t.description?.toLowerCase().includes(query))
    );
  });

  constructor(private taskService: TaskService, private router: Router) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  ngOnInit() {
    this.userEmail.set(localStorage.getItem('userEmail') || '');
    this.loadTasks();
    if (this.isAdmin()) {
      this.loadUsers();
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
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

  onUserChange(userId: any) { // Changed to any to avoid strict type error from template
    this.selectedUserId.set(userId);
    this.loadTasks();
  }

  onSearchChange(query: any) { // Helper for search change
    this.searchQuery.set(query);
  }

  blockUser() {
    const userId = this.selectedUserId();
    if (!userId) return;
    this.taskService.blockUser(userId).subscribe({
      next: (res) => {
        this.toast.show(res.message);
        this.loadUsers();
      },
      error: () => this.toast.show('Failed to update user status', 'error')
    });
  }

  deleteUser() {
    const userId = this.selectedUserId();
    if (!userId || !confirm('Are you sure?')) return;
    this.taskService.deleteUser(userId).subscribe({
      next: () => {
        this.toast.show('User deleted');
        this.selectedUserId.set('');
        this.loadUsers();
        this.loadTasks();
      },
      error: () => this.toast.show('Failed to delete user', 'error')
    });
  }

  saveTask() {
    if (this.taskForm.invalid) return;

    const taskData = this.taskForm.value;
    const restrictedRegex = /\b(sex|porn|xnxx|xvideos|nude|naked|pussy|dick|boobs|sexually|dirty|hentai|xxx|erotic|cum|asshole|vagina|penis|pornography)\b/i;
    
    if (restrictedRegex.test(taskData.title) || (taskData.description && restrictedRegex.test(taskData.description))) {
      this.toast.show('Dirty Content!', 'error');
      return;
    }

    if (this.editingId) {
      this.taskService.updateTask({ ...taskData, _id: this.editingId }).subscribe({
        next: () => { 
          this.toast.show('Task updated!');
          this.resetForm(); 
          this.loadTasks(); 
        },
        error: () => this.toast.show('Update failed', 'error')
      });
    } else {
      this.taskService.addTask(taskData).subscribe({
        next: () => { 
          this.toast.show('Task added!');
          this.resetForm(); 
          this.loadTasks(); 
        },
        error: () => this.toast.show('Failed to add task', 'error')
      });
    }
  }

  editTask(task: Task) {
    this.editingId = task._id!;
    this.taskForm.patchValue({
      title: task.title,
      description: task.description
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteTask(id: string) {
    this.taskService.deleteTask(id).subscribe({
      next: () => {
        this.toast.show('Task deleted');
        this.loadTasks();
      },
      error: () => this.toast.show('Delete failed', 'error')
    });
  }

  toggleComplete(task: Task) {
    this.taskService.updateTask({ ...task, completed: !task.completed }).subscribe({
      next: () => this.loadTasks(),
      error: () => this.toast.show('Status update failed', 'error')
    });
  }

  logout() {
    this.taskService.logout();
    this.toast.show('Logged out');
    this.router.navigate(['/login']);
  }

  resetForm() {
    this.taskForm.reset();
    this.editingId = null;
  }
}
