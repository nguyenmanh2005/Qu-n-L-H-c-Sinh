// src/features/admin/AdminAttendanceModal.tsx
  import { useEffect, useState } from 'react';
  import axios from 'axios';
  import { useAuthStore } from '@/store/authStore';

  function useApi() {
    const token = useAuthStore((s) => s.token);
    return axios.create({
      baseURL: 'http://localhost:5187/api',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  }

  interface Student {
    studentId: string;
    studentName: string;
    email?: string;
    status: string;
  }

  interface AttendanceRecord {
    studentId: string;
    present: boolean;
  }

  interface Props {
    classId: number;
    className: string;
    onClose: () => void;
  }

  function Msg({ text, type }: { text: string; type: 'success' | 'error' }) {
    return (
      <div style={{
        padding: '10px 14px', borderRadius: 8, margin: '10px 0',
        fontWeight: 600, fontSize: '0.9em', textAlign: 'center',
        background: type === 'success' ? '#dcfce7' : '#fee2e2',
        color: type === 'success' ? '#14532d' : '#991b1b',
        border: `1px solid ${type === 'success' ? '#86efac' : '#fca5a5'}`,
      }}>{text}</div>
    );
  }

  export default function AdminAttendanceModal({ classId, className, onClose }: Props) {
    const api = useApi();

    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [students, setStudents] = useState<Student[]>([]);
    const [attMap, setAttMap] = useState<Record<string, boolean>>({});
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Load học sinh khi mount
    useEffect(() => {
      const fetchStudents = async () => {
        try {
          const res = await api.get(`/admin/classes/${classId}/students`);
          const raw = res.data;
          const list: Student[] = Array.isArray(raw) ? raw
            : Array.isArray(raw?.students) ? raw.students
            : Array.isArray(raw?.data) ? raw.data
            : [];
          setStudents(list.filter(s => s.status === 'Approved'));
        } catch {
          setMsg({ text: 'Lỗi tải danh sách học sinh', type: 'error' });
        }
      };
      fetchStudents();
    }, [classId]);

    const loadAttendance = async () => {
      if (!date) return;
      try {
        const dateISO = new Date(date + 'T00:00:00').toISOString();
        const res = await api.get(`/admin/classes/${classId}/attendance?date=${encodeURIComponent(dateISO)}`);
        const map: Record<string, boolean> = {};
        (res.data as AttendanceRecord[] || []).forEach((a) => { map[a.studentId] = a.present; });
        setAttMap(map);
        setLoaded(true);
        setMsg(null);
      } catch {
        // Nếu chưa có điểm danh ngày này → init tất cả false
        const map: Record<string, boolean> = {};
        students.forEach(s => { map[s.studentId] = false; });
        setAttMap(map);
        setLoaded(true);
        setMsg(null);
      }
    };

    const saveAttendance = async () => {
      if (!loaded || !students.length) return setMsg({ text: 'Hãy tải danh sách trước', type: 'error' });
      setSaving(true);
      try {
        const entries = students.map(s => ({ studentId: s.studentId, present: attMap[s.studentId] ?? false }));
        await api.post(`/admin/classes/${classId}/attendance`, {
          date: new Date(date + 'T00:00:00').toISOString(), entries,
        });
        setMsg({ text: `✅ Đã lưu điểm danh ngày ${new Date(date).toLocaleDateString('vi-VN')}`, type: 'success' });
      } catch (e) {
        const err = e as { response?: { data?: { message?: string } } };
        setMsg({ text: '❌ ' + (err.response?.data?.message || 'Lỗi lưu điểm danh'), type: 'error' });
      } finally {
        setSaving(false);
      }
    };

    const checkAll = (val: boolean) => {
      const map: Record<string, boolean> = {};
      students.forEach(s => { map[s.studentId] = val; });
      setAttMap(map);
    };

    const presentCount = students.filter(s => attMap[s.studentId]).length;
    const absentCount  = students.length - presentCount;

    const thStyle: React.CSSProperties = {
      background: '#f8fafc', color: '#475569', fontWeight: 700,
      padding: '10px 14px', border: '1px solid #e2e8f0',
      textAlign: 'left', fontSize: '0.8em', textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    };
    const tdStyle: React.CSSProperties = {
      padding: '10px 14px', border: '1px solid #f1f5f9', fontSize: '0.9em',
    };

    return (
      <div
        id="attOverlay"
        onClick={e => { if ((e.target as HTMLElement).id === 'attOverlay') onClose(); }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 2000, display: 'flex', justifyContent: 'center',
          alignItems: 'flex-start', padding: '40px 16px', overflowY: 'auto',
        }}
      >
        <div style={{
          background: 'white', borderRadius: 16, padding: 28,
          width: '100%', maxWidth: 700, position: 'relative',
          boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1em', fontWeight: 800, color: '#0f172a' }}>
                📋 Điểm danh — {className}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.8em', color: '#94a3b8' }}>
                Admin có thể chỉnh sửa bất kỳ ngày nào
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4em', cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1 }}>✕</button>
          </div>

          {/* Toolbar */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: '0.78em', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📅 Chọn ngày
              </label>
              <input
                type="date"
                value={date}
                max={today}
                onChange={e => { setDate(e.target.value); setLoaded(false); setMsg(null); }}
                style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.92em', color: '#374151', outline: 'none' }}
              />
            </div>

            <button
              onClick={loadAttendance}
              style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.88em' }}
            >🔍 Tải danh sách</button>

            <button
              onClick={saveAttendance}
              disabled={!loaded || saving}
              style={{ padding: '8px 16px', background: loaded ? '#10b981' : '#9ca3af', color: 'white', border: 'none', borderRadius: 8, cursor: loaded ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.88em', opacity: saving ? 0.7 : 1 }}
            >💾 {saving ? 'Đang lưu...' : 'Lưu điểm danh'}</button>

            {loaded && (
              <>
                <button
                  onClick={() => checkAll(true)}
                  style={{ padding: '8px 14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.88em' }}
                >✔ Tất cả có mặt</button>
                <button
                  onClick={() => checkAll(false)}
                  style={{ padding: '8px 14px', background: '#f43f5e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.88em' }}
                >✘ Tất cả vắng</button>
              </>
            )}
          </div>

          {msg && <Msg {...msg} />}

          {/* Stats */}
          {loaded && students.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              {[
                { label: '✅ Có mặt', value: presentCount, bg: '#dcfce7', color: '#14532d' },
                { label: '❌ Vắng',   value: absentCount,  bg: '#fee2e2', color: '#991b1b' },
                { label: '👥 Tổng',   value: students.length, bg: '#e0f2fe', color: '#075985' },
                { label: '📊 Tỉ lệ',  value: `${students.length > 0 ? Math.round(presentCount / students.length * 100) : 0}%`, bg: '#f1f5f9', color: '#475569' },
              ].map(s => (
                <div key={s.label} style={{ padding: '8px 16px', borderRadius: 8, fontWeight: 700, background: s.bg, color: s.color, fontSize: '0.88em' }}>
                  {s.label}: {s.value}
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          {!loaded ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#cbd5e1' }}>
              <div style={{ fontSize: '2.5em', marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: '0.9em' }}>Chọn ngày và nhấn "Tải danh sách"</div>
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#cbd5e1' }}>
              <div style={{ fontSize: '2.5em', marginBottom: 8 }}>👥</div>
              <div style={{ fontSize: '0.9em' }}>Chưa có học sinh được duyệt trong lớp này</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 40 }}>#</th>
                    <th style={thStyle}>Họ và tên</th>
                    <th style={thStyle}>Email</th>
                    <th style={{ ...thStyle, width: 120, textAlign: 'center' }}>Có mặt</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr
                      key={s.studentId}
                      style={{ background: attMap[s.studentId] ? '#f0fdf4' : 'white', transition: 'background 0.15s' }}
                      onMouseEnter={e => { if (!attMap[s.studentId]) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = attMap[s.studentId] ? '#f0fdf4' : 'white'; }}
                    >
                      <td style={{ ...tdStyle, color: '#94a3b8', fontWeight: 600 }}>{i + 1}</td>
                      <td style={tdStyle}><strong style={{ color: '#1e293b' }}>{s.studentName}</strong></td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{s.email || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={attMap[s.studentId] ?? false}
                            onChange={e => setAttMap(prev => ({ ...prev, [s.studentId]: e.target.checked }))}
                            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#10b981' }}
                          />
                          <span style={{ fontSize: '1.1em' }}>{attMap[s.studentId] ? '✅' : '❌'}</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }