// src/features/teacher/hooks/useTeacherApi.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export function useTeacherApi() {
  const token = useAuthStore((s) => s.token);
  return axios.create({
    baseURL: 'http://localhost:5187/api/teacher',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}