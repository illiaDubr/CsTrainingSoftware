export interface Routine {
  id: number;
  group_id: number;
  coach_id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RoutineProgress {
  id: number;
  routine_id: number;
  player_id: number;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
  note?: string;
  time_spent_minutes?: number;
  completed_at?: Date;
  updated_at: Date;
}