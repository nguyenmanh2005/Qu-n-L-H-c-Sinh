// src/features/student/StudentDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentApi } from './hooks/useStudentApi';
import StudentInfoCard from './components/StudentInfoCard';
import ClassesTab from './components/ClassesTab';
import ScheduleTab from './components/ScheduleTab';
import AttendanceTab from './components/AttendanceTab';
import { useAuthStore } from '@/store/authStore';

type Tab = 'classes' | 'schedule' | 'attendance';

export interface ApprovedClass {
  id: number;
  classId?: number;
  name: string;
  code: string;
  teacher?: string;
  teacherName?: string;
  schedule?: string;
  startDate?: string;
  daysOfWeek?: number[];
  timeStart?: string;
  timeEnd?: string;
  room?: string;
  status?: string;
}

export interface ScheduleSlot {
  dayOfWeek: number;
  dayName: string;
  slotNumber?: number;   // ← thêm
  timeStart: string;
  timeEnd: string;
  room?: string;
}

export interface ScheduleClass {
  classId: number;
  className: string;
  classCode: string;
  scheduleRaw?: string;
  startDate?: string;
  teacherName: string;
  slots: ScheduleSlot[];
}

export default function StudentDashboard() {
  const api = useStudentApi();
  const { token, user, logout } = useAuthStore();
  const role = user?.role;
  const navigate = useNavigate();

  const [activeTab, setActiveTab]             = useState<Tab>('classes');
  const [profile, setProfile]                 = useState<any>(null);
  const [allClasses, setAllClasses]           = useState<any[]>([]);
  const [approvedClasses, setApprovedClasses] = useState<ApprovedClass[]>([]);
  const [scheduleClasses, setScheduleClasses] = useState<ScheduleClass[]>([]);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    if (!token || role !== 'Student') { navigate('/login'); return; }
    (async () => {
      try {
        const profileRes = await api.get('/profile');
        setProfile(profileRes.data);
        await loadClasses();
      } catch (err) {
        console.error(err);
        logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, role]);

  const loadClasses = async () => {
    try {
      const [clsRes, schRes] = await Promise.all([
        api.get('/classes'),
        api.get('/schedule').catch(() => ({ data: [] })),
      ]);

      const classes: any[]           = clsRes.data || [];
      const schData: ScheduleClass[] = schRes.data || [];

      setAllClasses(classes);
      setScheduleClasses(schData);

      setApprovedClasses(
        classes
          .filter((c: any) => c.status === 'Approved')
          .map((c: any) => ({ ...c }))
      );
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#777', fontFamily: 'Segoe UI, sans-serif' }}>
      Đang tải...
    </div>
  );

  const tabConfig: { key: Tab; label: string }[] = [
    { key: 'classes',    label: '🏫 Lớp học' },
    { key: 'schedule',   label: '📅 Lịch học' },
    { key: 'attendance', label: '📋 Điểm danh' },
  ];

  return (
    <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', margin: 0, padding: '20px', backgroundColor: '#f5f7fa', color: '#333', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <header style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white', padding: '20px', borderRadius: 10,
          marginBottom: 30, textAlign: 'center', position: 'relative',
        }}>
          <h1 style={{ margin: '0.3em 0', fontSize: '1.8em' }}>
            Chào mừng, {profile?.fullName || user?.username || 'Học sinh'}!
          </h1>
          <p style={{ margin: 0, opacity: 0.9 }}>Trang cá nhân học sinh</p>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.2)', border: '1px solid white',
              color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
            }}
          >Đăng xuất</button>
        </header>

        <StudentInfoCard user={profile} />

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #eee', flexWrap: 'wrap' }}>
          {tabConfig.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '10px 20px', background: activeTab === key ? 'white' : 'none',
                border: 'none', borderRadius: '8px 8px 0 0',
                color: activeTab === key ? '#667eea' : '#888',
                cursor: 'pointer', fontSize: '1em',
                fontWeight: activeTab === key ? 700 : 400,
                borderBottom: activeTab === key ? '3px solid #667eea' : '3px solid transparent',
                marginBottom: -2,
              }}
            >{label}</button>
          ))}
        </div>

        {activeTab === 'classes'    && <ClassesTab allClasses={allClasses} onReload={loadClasses} />}
        {activeTab === 'schedule'   && <ScheduleTab approvedClasses={approvedClasses} scheduleClasses={scheduleClasses} />}
        {activeTab === 'attendance' && <AttendanceTab />}

        <footer style={{ textAlign: 'center', marginTop: 40, color: '#777', fontSize: '0.9em' }}>
          © 2026 Student Management System
        </footer>
      </div>
    </div>
  );
}