export interface Group {
  id: number;
  name: string;
  description?: string;
  coach_id: number;
  created_at: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface TaskProgress {
  id: number;
  task_id: number;
  player_id: number;
  status: TaskStatus;
  note?: string;
  completed_at?: string;
}

export interface Task {
  id: number;
  group_id: number;
  coach_id: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string;
  created_at: string;
  progress: TaskProgress;
}


export interface Training {
  id: number;
  group_id: number;
  coach_id: number;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes?: number;
  created_at: string;
}

export type MaterialType = 'video' | 'document' | 'link' | 'image';

export interface Material {
  id: number;
  group_id: number;
  coach_id: number;
  title: string;
  description?: string;
  file_url?: string;
  external_url?: string;
  type: MaterialType;
  created_at: string;
}

export interface RoutineProgress {
  id?: number;
  routine_id: number;
  player_id?: number;
  date?: string;
  status: TaskStatus;
  note?: string;
  username?: string; // для coach view, где progress — массив
}

export interface Routine {
  id: number;
  group_id: number;
  coach_id: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  is_active: boolean;
  created_at: string;
  progress: RoutineProgress | RoutineProgress[];
}