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

// --- Тактики / коллы ---
export interface TacticArrow {
  id?: string | number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  color?: string;
  label?: string;
}

export interface Tactic {
  id: number;
  group_id: number;
  coach_id: number;
  title: string;
  map_name: string;
  side: NadeSide;
  description?: string | null;
  movement_arrows: TacticArrow[];
  created_at: string;
  updated_at?: string;
  nades: Nade[];
  nade_count?: number;
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

// --- Админка ---
export type AdminRole = 'admin' | 'coach' | 'player';

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  role: AdminRole;
  full_name?: string | null;
  in_game_role?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AdminUserDetail extends AdminUser {
  memberOf: { id: number; name: string; is_assistant_coach: boolean }[];
  coaches: { id: number; name: string; created_at: string }[];
  contentCounts: {
    nades: number; tactics: number; materials: number; trainings: number; matches: number;
  };
}

export interface AdminGroup {
  id: number;
  name: string;
  description?: string | null;
  coach_id: number;
  coach_username: string;
  coach_email: string;
  created_at: string;
  member_count: number;
}

export interface AdminGroupMember {
  id: number;
  username: string;
  email: string;
  avatar_url?: string | null;
  is_active: boolean;
  is_assistant_coach: boolean;
}

export interface AdminGroupDetail extends Omit<AdminGroup, 'member_count'> {
  updated_at?: string;
  members: AdminGroupMember[];
  contentCounts: {
    nades: number; tactics: number; materials: number; trainings: number;
    matches: number; tasks: number; routines: number;
  };
}

export interface AdminOverview {
  users: { total: number; active: number; inactive: number; admin: number; coach: number; player: number };
  groups: number;
  content: {
    nades: number; tactics: number; materials: number; trainings: number;
    matches: number; tasks: number; routines: number;
  };
  signupSeries: { date: string; count: number }[];
  recentUsers: AdminUser[];
  recentGroups: { id: number; name: string; created_at: string; coach_username: string }[];
}

export interface AdminNadeItem {
  id: number;
  title: string;
  map_name: string;
  side: NadeSide;
  category: string;
  nade_type: string;
  group_id: number | null;
  group_name?: string;
  coach_username: string;
  created_at: string;
}

export interface AdminTacticItem {
  id: number;
  title: string;
  map_name: string;
  side: NadeSide;
  group_id: number;
  group_name: string;
  coach_username: string;
  created_at: string;
}

export interface AdminMaterialItem {
  id: number;
  title: string;
  type: string;
  external_url?: string | null;
  file_url?: string | null;
  group_id: number;
  group_name: string;
  coach_username?: string;
  created_at: string;
}

export interface AdminTrainingItem {
  id: number;
  title: string;
  scheduled_at: string;
  duration_minutes?: number | null;
  group_id: number;
  group_name: string;
  coach_username?: string;
  created_at: string;
}

export interface AdminMatchItem {
  id: number;
  opponent: string;
  match_class: MatchClass;
  scheduled_at: string;
  group_id: number;
  group_name: string;
  created_by_username: string;
  created_at: string;
}
