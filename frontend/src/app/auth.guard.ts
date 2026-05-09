import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TaskService } from './services/task.service';

export const authGuard: CanActivateFn = (route, state) => {
  const taskService = inject(TaskService);
  const router = inject(Router);

  if (taskService.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
