// src/features/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { C, S } from '@/styles';

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuthStore();

  const [form, setForm]   = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError('Vui lòng nhập đầy đủ thông tin'); return;
    }
    setLoading(true); setError('');
    try {
      const res = await axios.post('http://localhost:5187/api/auth/login', form);
      const { token, role, fullName, userId, username } = res.data;

      login(token, { id: userId, username: username || form.username, fullName, role });

      if (role === 'Teacher') navigate('/teacher');
      else if (role === 'Student') navigate('/student');
      else if (role === 'Admin') navigate('/admin');
      else setError('Role không hợp lệ');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Sai tài khoản hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: C.bg,
      fontFamily: 'Segoe UI, sans-serif',
    }}>
      <div style={{ ...S.card, width: 380, padding: '40px 36px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: `linear-gradient(135deg, ${C.primary}, ${C.teacher})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 14px',
          }}>📚</div>
          <h2 style={{ margin: 0, color: C.text, fontSize: '1.5em' }}>Assignment System</h2>
          <p style={{ margin: '6px 0 0', color: C.textMuted, fontSize: '0.9em' }}>
            Đăng nhập để tiếp tục
          </p>
        </div>

        {/* Form */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Tài khoản</label>
          <input
            style={S.input}
            placeholder="Username hoặc Email"
            value={form.username}
            onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={S.label}>Mật khẩu</label>
          <input
            style={S.input}
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            color: C.danger, borderRadius: 8, padding: '10px 14px',
            fontSize: '0.88em', marginBottom: 16,
          }}>{error}</div>
        )}

        <button
          style={{ ...S.btn(), width: '100%', padding: '12px', fontSize: '1em' }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, color: C.textLight, fontSize: '0.82em' }}>
          Dùng tài khoản từ hệ thống quản lý sinh viên
        </p>
      </div>
    </div>
  );
}
