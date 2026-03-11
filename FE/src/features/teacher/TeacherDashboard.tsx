// src/features/teacher/TeacherDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeacherApi } from './hooks/useTeacherApi';
import TeacherInfoCard from './components/TeacherInfoCard';
import ClassesTab from './components/ClassesTab';
import ScheduleTab from './components/ScheduleTab';
import RestoreRequestsTab from './components/RestoreRequestsTab';
import GradesTab from './components/GradesTab';  // ← THÊM MỚI
import ClassModal from './components/ClassModal';
import { useAuthStore } from '@/store/authStore';

type Tab = 'classes' | 'schedule' | 'restore' | 'grades';  // ← THÊM 'grades'

export interface ClassInfo {
  id: number;
  name: string;
  code: string;
  studentCount?: number;
  schedule?: string;
  startDate?: string;
}

const S = {
  body: {
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    margin: 0, padding: '20px',
    backgroundColor: '#f5f7fa', color: '#333', minHeight: '100vh',
  } as React.CSSProperties,
  container: { maxWidth: 1200, margin: '0 auto' } as React.CSSProperties,
  header: {
    background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
    color: 'white', padding: '20px',
    borderRadius: 10, marginBottom: 30,
    textAlign: 'center' as const, position: 'relative' as const,
  },
  logoutBtn: {
    position: 'absolute' as const, top: 20, right: 20,
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid white', color: 'white',
    padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: '0.95em',
  },
};

export default function TeacherDashboard() {
  const api = useTeacherApi();
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  const role = user?.role;

  const [activeTab, setActiveTab] = useState<Tab>('classes');
  const [teacher, setTeacher] = useState<any>(null);
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [modalClass, setModalClass] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || role !== 'Teacher') { navigate('/login'); return; }
    (async () => {
      try {
        const [profileRes, clsRes] = await Promise.all([
          api.get('/profile'),
          api.get('/classes'),
        ]);
        setTeacher(profileRes.data);
        setAllClasses(clsRes.data || []);
      } catch (err) {
        console.error(err);
        logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, role]);

  const reloadClasses = async () => {
    try { const r = await api.get('/classes'); setAllClasses(r.data || []); } catch {}
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0', color: '#777' }}>Đang tải...</div>;

  const tabConfig: { key: Tab; label: string }[] = [
    { key: 'classes',  label: '🏫 Lớp học' },
    { key: 'schedule', label: '📅 Lịch học' },
    { key: 'grades',   label: '📊 Xem điểm' },   // ← THÊM MỚI
    { key: 'restore',  label: '📬 Đơn khôi phục' },
  ];

  return (
    <div style={S.body}>
      <div style={S.container}>

        {/* ── Header ── */}
        <header style={S.header}>
          <h1 style={{ margin: '0.3em 0', fontSize: '1.8em' }}>
            Chào mừng, {teacher?.fullName || user?.username || 'Giáo viên'}!
          </h1>
          <p style={{ margin: 0, opacity: 0.9 }}>Trang quản lý lớp học</p>
          <button style={S.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>Đăng xuất</button>
        </header>

        {/* ── Info card ── */}
        <TeacherInfoCard teacher={teacher} />

        {/* ── Main tabs ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #eee', flexWrap: 'wrap' }}>
          {tabConfig.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '10px 20px', background: activeTab === key ? 'white' : 'none',
                border: 'none', borderRadius: '8px 8px 0 0',
                color: activeTab === key ? '#ff6b6b' : '#888',
                cursor: 'pointer', fontSize: '1em',
                fontWeight: activeTab === key ? 700 : 400,
                borderBottom: activeTab === key ? '3px solid #ff6b6b' : '3px solid transparent',
                marginBottom: -2,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        {activeTab === 'classes' && (
          <ClassesTab allClasses={allClasses} onReload={reloadClasses} openModal={setModalClass} />
        )}
        {activeTab === 'schedule' && (
          <ScheduleTab allClasses={allClasses} openModal={setModalClass} />
        )}
        {activeTab === 'grades' && (
          <GradesTab allClasses={allClasses} />   // ← THÊM MỚI
        )}
        {activeTab === 'restore' && <RestoreRequestsTab />}

        {/* ── Modal ── */}
        {modalClass && (
          <ClassModal
            classInfo={modalClass}
            onClose={() => { setModalClass(null); reloadClasses(); }}
          />
        )}

      </div>
    </div>
  );
}