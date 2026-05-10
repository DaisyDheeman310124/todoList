import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../services/task.service';

export const authGuard = () => {
  const taskService = inject(TaskService);
  const router = inject(Router);

  if (taskService.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
