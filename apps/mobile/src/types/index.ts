export interface Group {
  id: number;
  name: string;
  description?: string;
  coach_id: number;
  created_at: string;
  is_assistant_coach?: boolean; // для игрока: назначен ли он помощником тренера в этой группе
  members?: GroupMember[];
}

export interface GroupMember {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  is_assistant_coach: boolean;
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

export interface MonthProgressDay {
  date: string;
  status: TaskStatus;
  note?: string;
  time_spent_minutes?: number | null;
}

export interface PlayerRoutineStat {
  playerId: number;
  username: string;
  todayStatus: TaskStatus;
  completionRate: number;
  monthProgress: MonthProgressDay[];
  todayNote: string;
  todayTimeSpent?: number | null;
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
  // player view
  todayStatus?: TaskStatus;
  todayNote?: string;
  todayTimeSpent?: number | null;
  monthProgress?: MonthProgressDay[];
  completionRate?: number;
  // coach view
  playerStats?: PlayerRoutineStat[];
  // legacy
  
  progress?: RoutineProgress | RoutineProgress[];
}
// --- Раскидки (nades) ---
export type NadeSide = 'T' | 'CT';
export type NadeCategory = 'base' | 'default' | 'extra';
export type NadeType = 'smoke' | 'flash' | 'molotov' | 'he';
export type NadeImageType = 'position' | 'aim' | 'result' | 'other';

export interface NadeImage {
  id: number;
  nade_id: number;
  image_url: string;
  image_type: NadeImageType;
  sort_order: number;
}

export interface Nade {
  id: number;
  group_id: number;
  coach_id: number;
  map_name: string;
  side: NadeSide;
  category: NadeCategory;
  nade_type: NadeType;
  title: string;
  description?: string;
  video_url?: string | null;
  throw_x?: number | null;
  throw_y?: number | null;
  land_x?: number | null;
  land_y?: number | null;
  created_at: string;
  images: NadeImage[];
}

export interface NadeMapSummary {
  map_name: string;
  count: number;
}

export interface MapBackground {
  id: number;
  group_id: number;
  map_name: string;
  coach_id: number;
  image_url: string;
}

// --- Матчи ---
export type MatchClass = 'esea' | 'other';

export interface Match {
  id: number;
  group_id: number;
  created_by: number;
  created_by_username?: string;
  match_class: MatchClass;
  opponent: string;
  scheduled_at: string;
  note?: string;
  created_at: string;
}
