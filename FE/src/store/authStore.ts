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
      
      // Hàm đăng nhập: lưu token và thông tin user vào state
      login: (token: string, user: User) => { // Lưu token và user vào state
        set({ token, user }); // Lưu token và user vào state
      },

      // Hàm đăng xuất: xóa token và thông tin user khỏi state
      logout: () => {
        set({ token: null, user: null });
      },

      // Hàm kiểm tra xem người dùng đã đăng nhập hay chưa
      isAuthenticated: () => !!get().token,
      // Hàm lấy thông tin người dùng hiện tại
      getUser: () => get().user,
    }),
    {// Cấu hình persist để lưu trữ token và user vào localStorage
      name: 'auth-storage', // Tên key trong localStorage
      partialize: (state) => ({// Chỉ lưu token và user vào localStorage, không lưu các hàm
        token: state.token,// Lưu token và user vào localStorage
        user: state.user,
      }),
    }
  )
);