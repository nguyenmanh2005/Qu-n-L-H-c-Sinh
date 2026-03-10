// src/features/teacher/TeacherAssignmentDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useApi } from '@/hooks/useApi';
import { C, S } from '@/styles';
import type { AssignmentDto, SubmissionDto } from '@/types';

type Tab = 'assignments' | 'grade';

export default function TeacherAssignmentDashboard() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuthStore();
  const api = useApi();

  const [tab, setTab]                 = useState<Tab>('assignments');
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [loading, setLoading]         = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [gradeTarget, setGradeTarget] = useState<AssignmentDto | null>(null);

  useEffect(() => {
    if (!token || user?.role !== 'Teacher') { navigate('/'); return; }
    loadAssignments();
  }, [token]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teacher/assignments');
      setAssignments(res.data || []);
    } catch { logout(); navigate('/'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa bài tập này và tất cả bài nộp?')) return;
    try {
      await api.delete(`/teacher/assignments/${id}`);
      loadAssignments();
    } catch { alert('Lỗi khi xóa'); }
  };

  if (loading) return <Loading />;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Segoe UI, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.teacher}, #a855f7)`,
        color: '#fff', padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5em' }}>🎓 Quản lý bài tập</h1>
          <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9em' }}>
            Xin chào, {user?.fullName || user?.username}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={S.btn('#fff')} onClick={() => setCreateModal(true)}>
            <span style={{ color: C.teacher }}>+ Tạo bài tập</span>
          </button>
          <button style={S.btnOutline('#fff')} onClick={() => { logout(); navigate('/'); }}>
            Đăng xuất
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Tổng bài tập', value: assignments.length, icon: '📋', color: C.teacher },
            { label: 'Đang mở', value: assignments.filter(a => a.isOpen).length, icon: '🟢', color: C.success },
            { label: 'Đã đóng', value: assignments.filter(a => a.isExpired).length, icon: '🔴', color: C.danger },
          ].map(s => (
            <div key={s.label} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: '2em' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '1.6em', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.82em', color: C.textMuted }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Assignment list */}
        {assignments.length === 0 && <Empty text="Chưa có bài tập nào. Tạo bài tập đầu tiên!" />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {assignments.map(a => (
            <AssignmentRow
              key={a.id}
              assignment={a}
              onGrade={() => setGradeTarget(a)}
              onDelete={() => handleDelete(a.id)}
              onReload={loadAssignments}
              api={api}
            />
          ))}
        </div>
      </div>

      {createModal && (
        <CreateAssignmentModal
          api={api}
          onClose={() => { setCreateModal(false); loadAssignments(); }}
        />
      )}

      {gradeTarget && (
        <GradeModal
          assignment={gradeTarget}
          api={api}
          onClose={() => setGradeTarget(null)}
        />
      )}
    </div>
  );
}

// ── Assignment Row ────────────────────────────────────────────
function AssignmentRow({ assignment: a, onGrade, onDelete, onReload, api }: {
  assignment: AssignmentDto;
  onGrade: () => void;
  onDelete: () => void;
  onReload: () => void;
  api: ReturnType<typeof useApi>;
}) {
  const [editMode, setEditMode] = useState(false);
  const statusColor = a.isExpired ? C.danger : a.isOpen ? C.success : C.warning;
  const statusText  = a.isExpired ? 'Đã đóng' : a.isOpen ? 'Đang mở' : 'Chưa mở';

  return (
    <div style={{ ...S.card, borderLeft: `4px solid ${statusColor}` }}>
      {editMode ? (
        <EditAssignmentForm
          assignment={a}
          api={api}
          onDone={() => { setEditMode(false); onReload(); }}
          onCancel={() => setEditMode(false)}
        />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, color: C.text }}>{a.title}</h3>
              <span style={S.badge(statusColor, statusColor + '18')}>{statusText}</span>
            </div>
            <p style={{ margin: '5px 0 0', color: C.textMuted, fontSize: '0.88em' }}>
              🏫 {a.className}
            </p>
            {a.description && (
              <p style={{ margin: '6px 0 0', color: C.text, fontSize: '0.9em' }}>{a.description}</p>
            )}
            <div style={{ marginTop: 10, display: 'flex', gap: 20, fontSize: '0.83em', color: C.textMuted, flexWrap: 'wrap' }}>
              <span>📅 Mở: {fmt(a.openAt)}</span>
              <span>⏰ Hạn: {fmt(a.dueAt)}</span>
              <span style={{ color: C.teacher, fontWeight: 600 }}>
                📤 {a.submissionCount} bài nộp
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <button style={S.btn(C.teacher)} onClick={onGrade}>📝 Chấm điểm</button>
            <button style={S.btnOutline(C.primary)} onClick={() => setEditMode(true)}>✏️ Sửa</button>
            <button style={S.btnOutline(C.danger)} onClick={onDelete}>🗑️ Xóa</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Edit Assignment Form (inline) ─────────────────────────────
function EditAssignmentForm({ assignment: a, api, onDone, onCancel }: {
  assignment: AssignmentDto;
  api: ReturnType<typeof useApi>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: a.title,
    description: a.description || '',
    openAt: toInputDt(a.openAt),
    dueAt: toInputDt(a.dueAt),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true); setError('');
    try {
      await api.put(`/teacher/assignments/${a.id}`, {
        title: form.title,
        description: form.description,
        openAt: form.openAt,
        dueAt: form.dueAt,
      });
      onDone();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Lỗi khi cập nhật');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={S.label}>Tiêu đề</label>
          <input style={S.input} value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={S.label}>Mô tả</label>
          <textarea style={{ ...S.input, height: 60, resize: 'vertical' }} value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div>
          <label style={S.label}>Giờ mở</label>
          <input type="datetime-local" style={S.input} value={form.openAt}
            onChange={e => setForm(p => ({ ...p, openAt: e.target.value }))} />
        </div>
        <div>
          <label style={S.label}>Hạn nộp</label>
          <input type="datetime-local" style={S.input} value={form.dueAt}
            onChange={e => setForm(p => ({ ...p, dueAt: e.target.value }))} />
        </div>
      </div>
      {error && <p style={{ color: C.danger, fontSize: '0.88em', margin: '0 0 10px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={S.btn(C.teacher)} onClick={save} disabled={loading}>
          {loading ? 'Đang lưu...' : '💾 Lưu'}
        </button>
        <button style={S.btnOutline()} onClick={onCancel}>Hủy</button>
      </div>
    </div>
  );
}

// ── Create Modal ──────────────────────────────────────────────
function CreateAssignmentModal({ api, onClose }: {
  api: ReturnType<typeof useApi>;
  onClose: () => void;
}) {
  const [classes, setClasses]   = useState<{ id: number; name: string }[]>([]);
  const [form, setForm]         = useState({ title: '', description: '', classId: '', openAt: '', dueAt: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    api.get('/teacher/classes').then(r => setClasses(r.data || [])).catch(() => {});
  }, []);

  const save = async () => {
    if (!form.title || !form.classId || !form.openAt || !form.dueAt) {
      setError('Vui lòng điền đầy đủ thông tin'); return;
    }
    setLoading(true); setError('');
    try {
      await api.post('/teacher/assignments', {
        title: form.title,
        description: form.description || null,
        classId: Number(form.classId),
        openAt: form.openAt,
        dueAt: form.dueAt,
      });
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Lỗi khi tạo bài tập');
    } finally { setLoading(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ ...S.card, width: 500, padding: '28px 32px' }}>
        <h3 style={{ margin: '0 0 20px', color: C.text }}>+ Tạo bài tập mới</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={S.label}>Tiêu đề *</label>
            <input style={S.input} placeholder="VD: Bài tập tuần 1"
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label style={S.label}>Mô tả</label>
            <textarea style={{ ...S.input, height: 70, resize: 'vertical' }}
              placeholder="Mô tả yêu cầu bài tập..."
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <label style={S.label}>Lớp học *</label>
            <select style={S.input} value={form.classId}
              onChange={e => setForm(p => ({ ...p, classId: e.target.value }))}>
              <option value="">-- Chọn lớp --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>Giờ mở nộp *</label>
              <input type="datetime-local" style={S.input} value={form.openAt}
                onChange={e => setForm(p => ({ ...p, openAt: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>Hạn nộp *</label>
              <input type="datetime-local" style={S.input} value={form.dueAt}
                onChange={e => setForm(p => ({ ...p, dueAt: e.target.value }))} />
            </div>
          </div>
        </div>

        {error && <p style={{ color: C.danger, fontSize: '0.88em', margin: '12px 0 0' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button style={S.btnOutline()} onClick={onClose}>Hủy</button>
          <button style={S.btn(C.teacher)} onClick={save} disabled={loading}>
            {loading ? 'Đang tạo...' : '+ Tạo bài tập'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Grade Modal ───────────────────────────────────────────────
function GradeModal({ assignment, api, onClose }: {
  assignment: AssignmentDto;
  api: ReturnType<typeof useApi>;
  onClose: () => void;
}) {
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [loading, setLoading]         = useState(true);
  const [grading, setGrading]         = useState<number | null>(null);
  const [score, setScore]             = useState('');
  const [feedback, setFeedback]       = useState('');

  useEffect(() => {
    api.get(`/teacher/assignments/${assignment.id}/submissions`)
      .then(r => setSubmissions(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const submitGrade = async (submissionId: number) => {
    const s = parseFloat(score);
    if (isNaN(s) || s < 0 || s > 10) { alert('Điểm phải từ 0 đến 10'); return; }
    try {
      await api.post(`/teacher/assignments/submissions/${submissionId}/grade`, { score: s, feedback });
      const res = await api.get(`/teacher/assignments/${assignment.id}/submissions`);
      setSubmissions(res.data || []);
      setGrading(null); setScore(''); setFeedback('');
    } catch { alert('Lỗi khi chấm điểm'); }
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ ...S.card, width: 640, maxHeight: '80vh', overflow: 'auto', padding: '28px 32px' }}>
        <h3 style={{ margin: '0 0 6px', color: C.text }}>📝 Chấm điểm</h3>
        <p style={{ margin: '0 0 20px', color: C.textMuted, fontSize: '0.88em' }}>
          {assignment.title} · {submissions.length} bài nộp
        </p>

        {loading && <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Đang tải...</div>}

        {!loading && submissions.length === 0 && (
          <Empty text="Chưa có học sinh nào nộp bài" />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {submissions.map(s => (
            <div key={s.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, color: C.text }}>{s.studentName}</div>
                  <div style={{ fontSize: '0.83em', color: C.textMuted }}>{s.studentEmail}</div>
                  <div style={{ fontSize: '0.83em', color: C.textMuted, marginTop: 4 }}>
                    📎 {s.fileName} · Nộp lúc {fmt(s.submittedAt)}
                    {s.isLate && <span style={{ color: C.danger, marginLeft: 8 }}>· Muộn</span>}
                  </div>
                  {s.feedback && (
                    <div style={{ fontSize: '0.85em', color: C.text, marginTop: 6, fontStyle: 'italic' }}>
                      💬 {s.feedback}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {s.isGraded && grading !== s.id && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5em', fontWeight: 700, color: scoreColor(s.score!) }}>{s.score}</div>
                      <div style={{ fontSize: '0.72em', color: C.textMuted }}>/10</div>
                    </div>
                  )}
                  <button
                    style={S.btn(grading === s.id ? C.textMuted : C.teacher)}
                    onClick={() => {
                      if (grading === s.id) { setGrading(null); return; }
                      setGrading(s.id); setScore(s.score?.toString() || ''); setFeedback(s.feedback || '');
                    }}
                  >
                    {grading === s.id ? 'Hủy' : s.isGraded ? '✏️ Sửa điểm' : '+ Chấm điểm'}
                  </button>
                </div>
              </div>

              {grading === s.id && (
                <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: '0 0 100px' }}>
                    <label style={S.label}>Điểm (0-10)</label>
                    <input type="number" min={0} max={10} step={0.5} style={S.input}
                      value={score} onChange={e => setScore(e.target.value)} />
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={S.label}>Nhận xét</label>
                    <input style={S.input} placeholder="Tùy chọn..."
                      value={feedback} onChange={e => setFeedback(e.target.value)} />
                  </div>
                  <button style={S.btn(C.success)} onClick={() => submitGrade(s.id)}>
                    ✓ Lưu điểm
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button style={S.btnOutline()} onClick={onClose}>Đóng</button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function fmt(d: string) {
  return new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}
function scoreColor(s: number) {
  if (s >= 8) return C.success;
  if (s >= 6) return C.warning;
  return C.danger;
}
function toInputDt(iso: string) {
  return new Date(iso).toISOString().slice(0, 16);
}
function Loading() {
  return <div style={{ textAlign: 'center', padding: 80, color: C.textMuted }}>Đang tải...</div>;
}
function Empty({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>
      <div style={{ fontSize: '2.5em', marginBottom: 10 }}>📭</div>
      <div>{text}</div>
    </div>
  );
}
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  );
}
