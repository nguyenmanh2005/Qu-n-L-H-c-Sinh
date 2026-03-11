// src/hooks/useApi.ts
import { useMemo } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

/**
 * Hook dùng chung toàn app.
 * - useMemo đảm bảo KHÔNG tạo axios instance mới mỗi lần render.
 * - baseURL lấy từ .env → dễ đổi khi deploy hoặc chuyển sang API Gateway.
 *
 * Cách dùng:
 *   const api = useApi();
 *   const res = await api.get('/admin/users');
 */
export function useApi() {
  const token = useAuthStore((s) => s.token);

  return useMemo(
    () =>
      axios.create({
        baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5187/api',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),
    [token], // chỉ tạo lại khi token thay đổi (login/logout)
  );
}