export enum TaskStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    OVERDUE = 'overdue',
}

export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

export interface Task {
  id: number;
  group_id: number;
  coach_id: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
}


export interface TaskProgress {
    id: number;
    task_id: number;
    player_id: number;
    status: TaskStatus;
    note?: string;
    completed_at?: Date;
    updated_at: Date;
}