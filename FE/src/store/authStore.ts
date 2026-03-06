// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  userId: string;
  username: string;
  role: 'Admin' | 'Teacher' | 'Student';
};

type AuthState = {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  getUser: () => User | null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: (token: string, user: User) => {
        set({ token, user });
      },

      logout: () => {
        set({ token: null, user: null });
      },

      isAuthenticated: () => !!get().token,

      getUser: () => get().user,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);