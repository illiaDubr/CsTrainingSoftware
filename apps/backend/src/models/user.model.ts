export enum UserRole {
  PLAYER = 'player',
  ADMIN = 'admin',
  COACH = 'coach',
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  username: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type CreateUserDto = {
  email: string;
  username: string;
  password: string;
  role: UserRole;
};
