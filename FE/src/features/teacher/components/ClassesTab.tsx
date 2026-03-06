// src/features/teacher/components/ClassesTab.tsx
import { useEffect, useState } from 'react';
import { useTeacherApi } from '../hooks/useTeacherApi';
import type { ClassInfo } from '../TeacherDashboard';

interface Props {
  allClasses: ClassInfo[];
  onReload: () => Promise<void>;
  openModal: (cls: ClassInfo) => void;
}

const btn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: '6px 14px', fontSize: '0.88em',
  border: 'none', borderRadius: 6, cursor: 'pointer',
  color: 'white', transition: 'background 0.3s', ...extra,
});

export default function ClassesTab({ allClasses, onReload, openModal }: Props) {
  const api = useTeacherApi();
  const [requests, setRequests] = useState<any[]>([]);
  const [reqLoading, setReqLoading] = useState(true);

  const loadRequests = async () => {
    setReqLoading(true);
    try {
      // Collect all pending students across classes
      const pending: any[] = [];
      for (const cls of allClasses) {
        try {
          const res = await api.get(`/classes/${cls.id}/students`);
          const students = res.data.students || [];
          students
            .filter((s: any) => s.status === 'Pending')
            .forEach((s: any) => pending.push({ ...s, className: cls.name, classId: cls.id }));
        } catch {}
      }
      setRequests(pending);
    } finally {
      setReqLoading(false);
    }
  };

  useEffect(() => {
    if (allClasses.length) loadRequests();
    else setReqLoading(false);
  }, [allClasses]);

  const handleApprove = async (enrollmentId: number, classId: number) => {
    if (!confirm('Chấp nhận học sinh này?')) return;
    try {
      await api.post(`/enrollments/${enrollmentId}/approve`, {});
      await onReload();
      await loadRequests();
    } catch { alert('Duyệt thất bại'); }
  };

  const handleReject = async (enrollmentId: number, classId: number) => {
    if (!confirm('Từ chối yêu cầu này?')) return;
    try {
      await api.post(`/enrollments/${enrollmentId}/reject`, {});
      await onReload();
      await loadRequests();
    } catch { alert('Từ chối thất bại'); }
  };

  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #ffe0e0',
    borderRadius: 10, padding: 20, transition: 'all 0.2s',
  };

  return (
    <>
      {/* Classes grid */}
      <div style={{
        background: 'white', borderRadius: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        padding: 25, marginBottom: 30,
      }}>
        <h2 style={{ marginTop: 0 }}>Lớp học đang phụ trách</h2>
        {!allClasses.length ? (
          <p style={{ textAlign: 'center', color: '#777' }}>Bạn chưa phụ trách lớp nào.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {allClasses.map(cls => (
              <div
                key={cls.id}
                style={card}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)', e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.transform = '', e.currentTarget.style.boxShadow = '')}
              >
                <div style={{ fontSize: '1.15em', fontWeight: 'bold', marginBottom: 8, color: '#c0392b' }}>{cls.name}</div>
                <p style={{ color: '#888', fontSize: '0.9em', margin: '4px 0' }}>Mã: <strong>{cls.code}</strong></p>
                <p style={{ color: '#888', fontSize: '0.9em', margin: '4px 0' }}>👥 {cls.studentCount || 0} học sinh</p>
                <p style={{ color: '#888', fontSize: '0.9em', margin: '4px 0' }}>🕐 {cls.schedule || 'Chưa cập nhật'}</p>
                <p style={{ color: '#888', fontSize: '0.9em', margin: '4px 0' }}>
                  📅 {cls.startDate ? new Date(cls.startDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </p>
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    style={btn({ background: '#3498db' })}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2980b9')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#3498db')}
                    onClick={() => openModal(cls)}
                  >
                    ⚙️ Quản lý
                  </button>
                  <button
                    style={btn({ background: '#27ae60' })}
                    onMouseEnter={e => (e.currentTarget.style.background = '#219a52')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#27ae60')}
                    onClick={() => openModal(cls)}
                  >
                    📋 Điểm danh
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrollment requests */}
      <div style={{
        background: 'white', borderRadius: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        padding: 25, marginBottom: 30,
      }}>
        <h2 style={{ marginTop: 0 }}>Yêu cầu tham gia lớp</h2>
        {reqLoading ? (
          <p style={{ textAlign: 'center', color: '#777' }}>Đang tải...</p>
        ) : !requests.length ? (
          <p style={{ textAlign: 'center', color: '#777' }}>Không có yêu cầu tham gia nào.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Học sinh', 'Email', 'Lớp', 'Hành động'].map(h => (
                  <th key={h} style={{ background: '#fff5f5', color: '#c0392b', fontWeight: 600, padding: '10px 12px', border: '1px solid #eee', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((s, i) => (
                <tr key={s.enrollmentId} style={{ transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '10px 12px', border: '1px solid #eee', fontSize: '0.93em' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', border: '1px solid #eee', fontSize: '0.93em' }}><strong>{s.studentName}</strong></td>
                  <td style={{ padding: '10px 12px', border: '1px solid #eee', fontSize: '0.93em', color: '#666' }}>{s.email || '—'}</td>
                  <td style={{ padding: '10px 12px', border: '1px solid #eee', fontSize: '0.93em' }}>{s.className}</td>
                  <td style={{ padding: '10px 12px', border: '1px solid #eee', fontSize: '0.93em' }}>
                    <button
                      style={btn({ background: '#27ae60', marginRight: 4 })}
                      onClick={() => handleApprove(s.enrollmentId, s.classId)}
                    >✔</button>
                    <button
                      style={btn({ background: '#e74c3c' })}
                      onClick={() => handleReject(s.enrollmentId, s.classId)}
                    >✘</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}