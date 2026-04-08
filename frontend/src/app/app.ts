import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from './services/task.service';
import { Task } from './models/task.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container animate-fade-in">
      <h1>Task Manager</h1>
      
      <div class="card">
        <div class="task-form">
          <input 
            type="text" 
            [(ngModel)]="currentTask.title" 
            placeholder="What needs to be done?"
            (keyup.enter)="saveTask()"
          />
          <textarea 
            [(ngModel)]="currentTask.description" 
            placeholder="Add a description (optional)"
            rows="2"
          ></textarea>
          <button class="btn-primary" (click)="saveTask()">
            {{ editingId ? 'Update Task' : 'Add Task' }}
          </button>
        </div>
      </div>

      <div class="task-list">
        @for (task of tasks(); track task._id) {
          <div class="card task-item animate-fade-in">
            <div class="task-info" [class.completed]="task.completed">
              <div class="task-title">{{ task.title }}</div>
              @if (task.description) {
                <div class="task-desc">{{ task.description }}</div>
              }
            </div>
            <div class="actions">
              <button 
                class="btn-primary" 
                style="padding: 0.5rem 1rem; font-size: 0.8rem;" 
                (click)="toggleComplete(task)"
              >
                {{ task.completed ? 'Undo' : 'Complete' }}
              </button>
              <button 
                class="btn-primary" 
                style="padding: 0.5rem 1rem; font-size: 0.8rem; background: rgba(99, 102, 241, 0.2);"
                (click)="editTask(task)"
              >
                Edit
              </button>
              <button 
                class="btn-danger" 
                style="padding: 0.5rem 1rem; font-size: 0.8rem;"
                (click)="deleteTask(task._id!)"
              >
                Delete
              </button>
            </div>
          </div>
        } @empty {
          <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No tasks yet. Add one above!
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class App implements OnInit {
  tasks = signal<Task[]>([]);
  currentTask: Task = { title: '', description: '', completed: false };
  editingId: string | null = null;

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe(tasks => this.tasks.set(tasks));
  }

  saveTask() {
    if (!this.currentTask.title.trim()) return;

    if (this.editingId) {
      this.taskService.updateTask({ ...this.currentTask, _id: this.editingId }).subscribe(() => {
        this.resetForm();
        this.loadTasks();
      });
    } else {
      this.taskService.addTask(this.currentTask).subscribe(() => {
        this.resetForm();
        this.loadTasks();
      });
    }
  }

  editTask(task: Task) {
    this.currentTask = { ...task };
    this.editingId = task._id!;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteTask(id: string) {
    this.taskService.deleteTask(id).subscribe(() => this.loadTasks());
  }

  toggleComplete(task: Task) {
    this.taskService.updateTask({ ...task, completed: !task.completed }).subscribe(() => this.loadTasks());
  }

  resetForm() {
    this.currentTask = { title: '', description: '', completed: false };
    this.editingId = null;
  }
}
