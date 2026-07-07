import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type UserRole = 'admin' | 'coach' | 'player';

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  full_name?: string | null;
  in_game_role?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: AuthUser; accessToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
    updateProfile: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, updateProfile, logout } = authSlice.actions;
export default authSlice.reducer;
