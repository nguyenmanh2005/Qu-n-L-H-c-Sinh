// src/api/auth.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5187/api', // thay bằng URL backend thực tế của bạn
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để tự động gắn token nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API đăng nhập
export const loginApi = async (username: string, password: string) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data; // giả sử backend trả về { token, role, userId, username }
};

// API đăng ký
export const registerApi = async (data: { username: string; email: string; password: string }) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

