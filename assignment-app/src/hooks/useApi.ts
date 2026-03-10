// src/hooks/useApi.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const BASE_URL = 'http://localhost:5187/api';

export function useApi() {
  const token = useAuthStore(s => s.token);
  return axios.create({
    baseURL: BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
