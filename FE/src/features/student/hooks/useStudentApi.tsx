// src/features/student/hooks/useStudentApi.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export function useStudentApi() {
  const token = useAuthStore((s) => s.token);
  return axios.create({
    baseURL: 'http://localhost:5187/api/student',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}