// src/features/admin/AdminAssignmentDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useApi } from '@/hooks/useApi';
import { C, S } from '@/styles';
import type { AssignmentDto, SubmissionDto } from '@/types';

export default function AdminAssignmentDashboard() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuthStore();
  const api = useApi();

  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<AssignmentDto | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [subLoading, setSubLoading]   = useState(false);
  const [search, setSearch]           = useState('');

  useEffect(() => {
    if (!token || user?.role !== 'Admin') { navigate('/'); return; }
    loadAll();
  }, [token]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/assignments');
      setAssignments(res.data || []);
    } catch { logout(); navigate('/'); }
    finally { setLoading(false); }
  };

  const openSubmissions = async (a: AssignmentDto) => {
    setSelected(a); setSubLoading(true);
    try {
      const res = await api.get(`/admin/assignments/${a.id}/submissions`);
      setSubmissions(res.data || []);
    } catch { setSubmissions([]); }
    finally { setSubLoading(false); }
  };

  const deleteSubmission = async (id: number) => {
    if (!confirm('Xóa bài nộp này?')) return;
    try {
      await api.delete(`/admin/assignments/submissions/${id}`);
      setSubmissions(p => p.filter(s => s.id !== id));
    } catch { alert('Lỗi khi xóa'); }
  };

  const deleteAssignment = async (id: number) => {
    if (!confirm('Xóa bài tập này và TẤT CẢ bài nộp?')) return;
    try {
      await api.delete(`/admin/assignments/${id}`);
      if (selected?.id === id) setSelected(null);
      loadAll();
    } catch { alert('Lỗi khi xóa'); }
  };

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.className.toLowerCase().includes(search.toLowerCase()) ||
    (a.teacherName || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Segoe UI, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.admin}, #f87171)`,
        color: '#fff', padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5em' }}>⚙️ Admin — Quản lý bài tập</h1>
          <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9em' }}>
            {user?.fullName || user?.username}
          </p>
        </div>
        <button style={S.btnOutline('#fff')} onClick={() => { logout(); navigate('/'); }}>
          Đăng xuất
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>

        {/* Left: Assignment list */}
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Tổng', value: assignments.length, color: C.admin },
              { label: 'Đang mở', value: assignments.filter(a => a.isOpen).length, color: C.success },
              { label: 'Tổng bài nộp', value: assignments.reduce((n, a) => n + a.submissionCount, 0), color: C.teacher },
            ].map(s => (
              <div key={s.label} style={{ ...S.card, textAlign: 'center', padding: '14px' }}>
                <div style={{ fontSize: '1.6em', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.8em', color: C.textMuted }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <input
            style={{ ...S.input, marginBottom: 14 }}
            placeholder="🔍 Tìm theo tên bài, lớp, giáo viên..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 && <Empty text="Không có bài tập nào" />}
            {filtered.map(a => {
              const statusColor = a.isExpired ? C.danger : a.isOpen ? C.success : C.warning;
              const statusText  = a.isExpired ? 'Đã đóng' : a.isOpen ? 'Đang mở' : 'Chưa mở';
              const isActive    = selected?.id === a.id;

              return (
                <div key={a.id} style={{
                  ...S.card,
                  borderLeft: `4px solid ${statusColor}`,
                  background: isActive ? '#f0f4ff' : '#fff',
                  cursor: 'pointer',
                }} onClick={() => openSubmissions(a)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: C.text }}>{a.title}</span>
                        <span style={S.badge(statusColor, statusColor + '18')}>{statusText}</span>
                      </div>
                      <div style={{ fontSize: '0.82em', color: C.textMuted, marginTop: 4 }}>
                        🏫 {a.className} · 👩‍🏫 {a.teacherName} · 📤 {a.submissionCount} bài nộp
                      </div>
                      <div style={{ fontSize: '0.8em', color: C.textLight, marginTop: 3 }}>
                        ⏰ Hạn: {fmt(a.dueAt)}
                      </div>
                    </div>
                    <button
                      style={{ ...S.btnOutline(C.danger), padding: '5px 10px', fontSize: '0.8em' }}
                      onClick={e => { e.stopPropagation(); deleteAssignment(a.id); }}
                    >🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Submissions panel */}
        {selected && (
          <div>
            <div style={{ ...S.card, marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, color: C.text }}>📋 Bài nộp</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85em', color: C.textMuted }}>
                    {selected.title}
                  </p>
                </div>
                <button style={S.btnOutline()} onClick={() => setSelected(null)}>✕ Đóng</button>
              </div>

              {subLoading && <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Đang tải...</div>}

              {!subLoading && submissions.length === 0 && <Empty text="Chưa có bài nộp" />}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflow: 'auto' }}>
                {submissions.map(s => (
                  <div key={s.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: C.text, fontSize: '0.95em' }}>{s.studentName}</div>
                        <div style={{ fontSize: '0.8em', color: C.textMuted }}>{s.studentEmail}</div>
                        <div style={{ fontSize: '0.8em', color: C.textMuted, marginTop: 3 }}>
                          📎 {s.fileName} · {fmt(s.submittedAt)}
                          {s.isLate && <span style={{ color: C.danger, marginLeft: 6 }}>· Muộn</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        {s.isGraded ? (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.3em', fontWeight: 700, color: scoreColor(s.score!) }}>{s.score}</div>
                            <div style={{ fontSize: '0.7em', color: C.textMuted }}>/10</div>
                          </div>
                        ) : (
                          <span style={S.badge(C.textMuted, '#f1f5f9')}>Chưa chấm</span>
                        )}
                        <button
                          style={{ ...S.btnOutline(C.danger), padding: '5px 10px', fontSize: '0.8em' }}
                          onClick={() => deleteSubmission(s.id)}
                        >🗑️</button>
                      </div>
                    </div>
                    {s.feedback && (
                      <div style={{ marginTop: 8, fontSize: '0.82em', color: C.text, background: '#f8fafc', padding: '6px 10px', borderRadius: 6 }}>
                        💬 {s.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function fmt(d: string) {
  return new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}
function scoreColor(s: number) {
  if (s >= 8) return C.success; if (s >= 6) return C.warning; return C.danger;
}
function Loading() {
  return <div style={{ textAlign: 'center', padding: 80, color: C.textMuted }}>Đang tải...</div>;
}
function Empty({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>
      <div style={{ fontSize: '2em', marginBottom: 8 }}>📭</div><div>{text}</div>
    </div>
  );
}
