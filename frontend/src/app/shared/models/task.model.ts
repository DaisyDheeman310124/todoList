export interface Task {
  _id?: string;
  userId?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  createdAt?: string;
  updatedAt?: string;
}
