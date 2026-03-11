// src/lib/axios.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// Dev  → Vite proxy: /api/* → http://localhost:5187/api/*  (không bị CORS)
// Prod → đặt VITE_API_URL=https://your-backend.com/api trong .env.production
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Tự động đính kèm Bearer token vào mọi request
axiosInstance.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tự động logout nếu BE trả về 401 (token hết hạn)
axiosInstance.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;