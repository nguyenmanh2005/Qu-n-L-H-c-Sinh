// src/features/student/StudentDashboard.tsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useStudentApi } from './hooks/useStudentApi';
import StudentInfoCard from './components/StudentInfoCard';
import ClassesTab from './components/ClassesTab';
import ScheduleTab from './components/ScheduleTab';
import AttendanceTab from './components/AttendanceTab';
import { useAuthStore } from '@/store/authStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types cho StudentDashboard
// ─────────────────────────────────────────────────────────────────────────────
type Tab = 'classes' | 'schedule' | 'attendance' | 'grades';

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
  slotNumber?: number;
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

// ─────────────────────────────────────────────────────────────────────────────
// StudentGrades — nhúng thẳng vào file này, không cần import ngoài
// ─────────────────────────────────────────────────────────────────────────────
interface AssignmentItem {
  id: number;
  title: string;
  description?: string;
  classId: number;
  className: string;
  teacherName?: string;
  openAt: string;
  dueAt: string;
  isOpen: boolean;
  isExpired: boolean;
  submissionCount: number;
}

interface MySubmission {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  className: string;
  dueAt: string;
  fileName: string;
  submittedAt: string;
  isLate: boolean;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  canEdit: boolean;
}

type GradeSubTab = 'assignments' | 'grades';

function fmtDt(d: string) {
  return new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function ScoreDisplay({ score }: { score: number }) {
  const color = score >= 8
    ? { text: '#059669', bg: '#f0fdf4', border: '#a7f3d0' }
    : score >= 6.5
    ? { text: '#d97706', bg: '#fffbeb', border: '#fde68a' }
    : { text: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
  return (
    <div style={{
      border: `1.5px solid ${color.border}`, borderRadius: 12,
      padding: '6px 12px', textAlign: 'center', minWidth: 60,
      background: color.bg,
    }}>
      <div style={{ fontSize: '1.6em', fontWeight: 900, color: color.text, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: '0.72em', color: '#94a3b8' }}>/10</div>
      <div style={{ background: '#e2e8f0', borderRadius: 999, height: 4, marginTop: 4 }}>
        <div style={{ width: `${score * 10}%`, height: '100%', borderRadius: 999,
          background: score >= 8 ? '#10b981' : score >= 6.5 ? '#f59e0b' : '#ef4444' }} />
      </div>
    </div>
  );
}

function SubmitModal({ assignment, existingSub, token, onClose }: {
  assignment: AssignmentItem;
  existingSub?: MySubmission;
  token: string | null;
  onClose: () => void;
}) {
  const api = useMemo(() => axios.create({
    baseURL: 'http://localhost:5187/api',
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

  const [file, setFile]       = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async () => {
    if (!file) { setError('Vui lòng chọn file'); return; }
    setLoading(true); setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      if (existingSub) {
        await api.put(`/student/assignments/submissions/${existingSub.id}`, form,
          { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post(`/student/assignments/${assignment.id}/submit`, form,
          { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Lỗi khi nộp bài');
    } finally { setLoading(false); }
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  };
  const box: React.CSSProperties = {
    background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460,
    boxShadow: '0 24px 48px rgba(0,0,0,0.2)', overflow: 'hidden',
  };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1em', color: '#1e293b' }}>
            {existingSub ? '✏️ Sửa bài nộp' : '📤 Nộp bài'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4em', cursor: 'pointer', color: '#94a3b8' }}>×</button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: '0.9em' }}>
            <div style={{ fontWeight: 700, color: '#1e293b' }}>{assignment.title}</div>
            <div style={{ color: '#64748b', fontSize: '0.85em', marginTop: 4 }}>
              🏫 {assignment.className} · ⏰ Hạn: {fmtDt(assignment.dueAt)}
            </div>
          </div>

          {existingSub && (
            <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.88em', color: '#065f46' }}>
              📎 File hiện tại: <strong>{existingSub.fileName}</strong>
            </div>
          )}

          <label style={{ display: 'block', fontSize: '0.78em', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Chọn file
          </label>
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)}
            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: '0.9em', boxSizing: 'border-box' }} />
          {file && <p style={{ margin: '6px 0 0', fontSize: '0.82em', color: '#94a3b8' }}>📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: '0.88em' }}>
              ❌ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={onClose}
              style={{ padding: '9px 18px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '0.9em' }}>
              Hủy
            </button>
            <button onClick={submit} disabled={loading}
              style={{ padding: '9px 20px', background: loading ? '#9ca3af' : '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9em' }}>
              {loading ? '⏳ Đang nộp...' : existingSub ? '💾 Cập nhật' : '📤 Nộp bài'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentGrades() {
  const { token } = useAuthStore();
  const api = useMemo(() => axios.create({
    baseURL: 'http://localhost:5187/api',
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

  const [subTab, setSubTab]           = useState<GradeSubTab>('assignments');
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [submissions, setSubmissions] = useState<MySubmission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [submitModal, setSubmitModal] = useState<AssignmentItem | null>(null);
  const [editModal, setEditModal]     = useState<{ assignment: AssignmentItem; sub: MySubmission } | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [aRes, sRes] = await Promise.all([
        api.get('/student/assignments'),
        api.get('/student/assignments/my-submissions'),
      ]);
      setAssignments(aRes.data || []);
      setSubmissions(sRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const subMap   = new Map(submissions.map(s => [s.assignmentId, s]));
  const graded   = submissions.filter(s => s.score !== undefined && s.score !== null);
  const avgScore = graded.length > 0
    ? (graded.reduce((n, s) => n + (s.score ?? 0), 0) / graded.length).toFixed(1) : null;
  const openCount = assignments.filter(a => a.isOpen && !subMap.has(a.id)).length;

  const card: React.CSSProperties = {
    background: 'white', borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    border: '1px solid #f1f5f9', padding: '16px 20px',
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
      <div style={{ fontSize: '3em', marginBottom: 10 }}>📚</div>
      <div style={{ fontWeight: 600 }}>Đang tải bài tập...</div>
    </div>
  );

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Tổng bài tập',    value: assignments.length,                 icon: '📋', color: '#667eea' },
          { label: 'Cần nộp',         value: openCount,                          icon: '⚡', color: '#ef4444' },
          { label: 'Đã nộp',          value: submissions.length,                 icon: '✅', color: '#10b981' },
          { label: 'Điểm trung bình', value: avgScore ? `${avgScore}/10` : '—',  icon: '⭐', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ height: 4, background: s.color }} />
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2em', flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '1.4em', fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.75em', color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 12, marginBottom: 18, width: 'fit-content' }}>
        {([
          { key: 'assignments' as GradeSubTab, label: '📋 Bài tập' },
          { key: 'grades'      as GradeSubTab, label: '🏆 Điểm của tôi' },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => setSubTab(key)} style={{
            padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: '0.9em', fontWeight: 600, transition: 'all .15s',
            background: subTab === key ? '#fff' : 'transparent',
            color: subTab === key ? '#1e293b' : '#64748b',
            boxShadow: subTab === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      {/* ── Tab: Bài tập ── */}
      {subTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {assignments.length === 0 && <Empty text="Chưa có bài tập nào" />}
          {assignments.map(a => {
            const mySub      = subMap.get(a.id);
            const now        = new Date();
            const dueAt      = new Date(a.dueAt);
            const mins       = Math.max(0, Math.floor((dueAt.getTime() - now.getTime()) / 60000));
            const statusColor = a.isExpired ? '#ef4444' : a.isOpen ? '#10b981' : '#f59e0b';
            const statusText  = a.isExpired ? 'Đã đóng' : a.isOpen ? 'Đang mở' : 'Chưa mở';

            return (
              <div key={a.id} style={{ ...card, borderLeft: `4px solid ${statusColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.02em' }}>{a.title}</span>
                      <span style={{ fontSize: '0.78em', padding: '2px 10px', borderRadius: 20, fontWeight: 600, background: statusColor + '18', color: statusColor, border: `1px solid ${statusColor}40` }}>{statusText}</span>
                      {mySub && <span style={{ fontSize: '0.78em', padding: '2px 10px', borderRadius: 20, fontWeight: 600, background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0' }}>✓ Đã nộp</span>}
                      {mySub?.isLate && <span style={{ fontSize: '0.78em', padding: '2px 10px', borderRadius: 20, fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Muộn</span>}
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#64748b', marginBottom: 6 }}>
                      🏫 {a.className}{a.teacherName && <span> · 👩‍🏫 {a.teacherName}</span>}
                    </div>
                    {a.description && <div style={{ fontSize: '0.88em', color: '#475569', marginBottom: 8 }}>{a.description}</div>}
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.82em', color: '#94a3b8', flexWrap: 'wrap' }}>
                      <span>📅 Mở: {fmtDt(a.openAt)}</span>
                      <span>⏰ Hạn: {fmtDt(a.dueAt)}</span>
                      {a.isOpen && !a.isExpired && (
                        <span style={{ fontWeight: 700, color: mins < 60 ? '#ef4444' : mins < 1440 ? '#f59e0b' : '#64748b' }}>
                          ⏳ Còn {mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60}p` : `${mins}p`}
                        </span>
                      )}
                    </div>
                    {mySub && (
                      <div style={{ marginTop: 8, fontSize: '0.82em', color: '#94a3b8', background: '#f8fafc', borderRadius: 8, padding: '6px 12px', display: 'inline-flex', gap: 14, flexWrap: 'wrap' }}>
                        <span>📎 {mySub.fileName}</span>
                        <span>Nộp lúc {fmtDt(mySub.submittedAt)}</span>
                        {mySub.score !== undefined && mySub.score !== null && (
                          <span style={{ fontWeight: 700, color: mySub.score >= 8 ? '#059669' : mySub.score >= 6.5 ? '#d97706' : '#dc2626' }}>
                            Điểm: {mySub.score}/10
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0, flexWrap: 'wrap' }}>
                    {a.isOpen && !mySub && (
                      <button onClick={() => setSubmitModal(a)}
                        style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.88em' }}>
                        📤 Nộp bài
                      </button>
                    )}
                    {a.isOpen && mySub?.canEdit && (
                      <button onClick={() => setEditModal({ assignment: a, sub: mySub })}
                        style={{ padding: '8px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.88em' }}>
                        ✏️ Sửa bài
                      </button>
                    )}
                    {mySub?.score !== undefined && mySub.score !== null && <ScoreDisplay score={mySub.score} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab: Điểm ── */}
      {subTab === 'grades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {submissions.length === 0 && <Empty text="Chưa có bài nộp nào" />}
          {submissions.map(s => (
            <div key={s.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{s.assignmentTitle}</span>
                    {s.isLate && <span style={{ fontSize: '0.78em', padding: '2px 10px', borderRadius: 20, fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Nộp muộn</span>}
                  </div>
                  <div style={{ fontSize: '0.84em', color: '#64748b', marginBottom: 5 }}>
                    🏫 {s.className} · 📎 {s.fileName}
                  </div>
                  <div style={{ fontSize: '0.82em', color: '#94a3b8' }}>
                    Nộp lúc: {fmtDt(s.submittedAt)}
                    {s.gradedAt && <span style={{ marginLeft: 12 }}>· Chấm: {new Date(s.gradedAt).toLocaleDateString('vi-VN')}</span>}
                  </div>
                  {s.feedback && (
                    <div style={{ marginTop: 8, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8, padding: '8px 12px', fontSize: '0.88em', color: '#475569', fontStyle: 'italic' }}>
                      💬 {s.feedback}
                    </div>
                  )}
                </div>
                <div style={{ flexShrink: 0 }}>
                  {s.score !== undefined && s.score !== null
                    ? <ScoreDisplay score={s.score} />
                    : <span style={{ fontSize: '0.82em', background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', display: 'inline-block', whiteSpace: 'nowrap' }}>Chưa chấm</span>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {submitModal && (
        <SubmitModal assignment={submitModal} token={token} onClose={() => { setSubmitModal(null); loadAll(); }} />
      )}
      {editModal && (
        <SubmitModal assignment={editModal.assignment} existingSub={editModal.sub} token={token} onClose={() => { setEditModal(null); loadAll(); }} />
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8' }}>
      <div style={{ fontSize: '3em', marginBottom: 10 }}>📭</div>
      <div style={{ fontWeight: 600 }}>{text}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StudentDashboard chính
// ─────────────────────────────────────────────────────────────────────────────
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
        classes.filter((c: any) => c.status === 'Approved').map((c: any) => ({ ...c }))
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
    { key: 'grades',     label: '📚 Bài tập & Điểm' },
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

        {/* Tabs */}
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
        {activeTab === 'grades'     && <StudentGrades />}


      </div>
    </div>
  );
}