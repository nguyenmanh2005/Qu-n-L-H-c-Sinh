// src/features/student/StudentDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useApi } from '@/hooks/useApi';
import { C, S } from '@/styles';
import type { AssignmentDto, MySubmissionDto } from '@/types';

type Tab = 'assignments' | 'grades';

export default function StudentDashboard() {
  const navigate    = useNavigate();
  const { user, logout, token } = useAuthStore();
  const api         = useApi();

  const [tab, setTab]               = useState<Tab>('assignments');
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [submissions, setSubmissions] = useState<MySubmissionDto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [submitModal, setSubmitModal] = useState<AssignmentDto | null>(null);

  useEffect(() => {
    if (!token || user?.role !== 'Student') { navigate('/'); return; }
    loadAll();
  }, [token]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [aRes, sRes] = await Promise.all([
        api.get('/student/assignments'),
        api.get('/student/assignments/my-submissions'),
      ]);
      setAssignments(aRes.data || []);
      setSubmissions(sRes.data || []);
    } catch { logout(); navigate('/'); }
    finally { setLoading(false); }
  };

  if (loading) return <Loading />;

  // Map submissionId theo assignmentId để kiểm tra đã nộp chưa
  const submittedMap = new Map(submissions.map(s => [s.assignmentId, s]));

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Segoe UI, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.student}, #34d399)`,
        color: '#fff', padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5em' }}>📖 Trang học sinh</h1>
          <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9em' }}>
            Xin chào, {user?.fullName || user?.username}
          </p>
        </div>
        <button style={S.btnOutline('#fff')} onClick={() => { logout(); navigate('/'); }}>
          Đăng xuất
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: `2px solid ${C.border}` }}>
          {[
            { key: 'assignments', label: '📋 Bài tập' },
            { key: 'grades',      label: '🏆 Điểm của tôi' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key as Tab)} style={{
              padding: '10px 20px', background: 'none', border: 'none',
              borderBottom: tab === key ? `3px solid ${C.student}` : '3px solid transparent',
              color: tab === key ? C.student : C.textMuted,
              fontWeight: tab === key ? 700 : 400,
              cursor: 'pointer', fontSize: '0.95em', marginBottom: -2,
            }}>{label}</button>
          ))}
        </div>

        {/* Tab: Bài tập */}
        {tab === 'assignments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {assignments.length === 0 && <Empty text="Chưa có bài tập nào" />}
            {assignments.map(a => {
              const mySub = submittedMap.get(a.id);
              return (
                <AssignmentCard
                  key={a.id}
                  assignment={a}
                  mySubmission={mySub}
                  onSubmit={() => setSubmitModal(a)}
                  onReload={loadAll}
                  api={api}
                />
              );
            })}
          </div>
        )}

        {/* Tab: Điểm */}
        {tab === 'grades' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {submissions.length === 0 && <Empty text="Chưa có bài nộp nào" />}
            {submissions.map(s => <GradeCard key={s.id} submission={s} />)}
          </div>
        )}
      </div>

      {/* Modal nộp bài */}
      {submitModal && (
        <SubmitModal
          assignment={submitModal}
          existingSub={submittedMap.get(submitModal.id)}
          api={api}
          onClose={() => { setSubmitModal(null); loadAll(); }}
        />
      )}
    </div>
  );
}

// ── Assignment Card ───────────────────────────────────────────
function AssignmentCard({ assignment: a, mySubmission, onSubmit, onReload, api }: {
  assignment: AssignmentDto;
  mySubmission?: MySubmissionDto;
  onSubmit: () => void;
  onReload: () => void;
  api: ReturnType<typeof useApi>;
}) {
  const now    = new Date();
  const dueAt  = new Date(a.dueAt);
  const openAt = new Date(a.openAt);

  const statusColor = a.isExpired ? C.danger : a.isOpen ? C.success : C.warning;
  const statusText  = a.isExpired ? 'Đã đóng' : a.isOpen ? 'Đang mở' : 'Chưa mở';

  const timeLeft = a.isOpen
    ? Math.max(0, Math.floor((dueAt.getTime() - now.getTime()) / 60000))
    : null;

  return (
    <div style={{ ...S.card, borderLeft: `4px solid ${statusColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, color: C.text, fontSize: '1.05em' }}>{a.title}</h3>
            <span style={S.badge(statusColor, statusColor + '18')}>{statusText}</span>
            {mySubmission && (
              <span style={S.badge(C.success, '#d1fae5')}>✓ Đã nộp</span>
            )}
            {mySubmission?.isLate && (
              <span style={S.badge(C.danger, '#fee2e2')}>Nộp muộn</span>
            )}
          </div>
          <p style={{ margin: '6px 0 0', color: C.textMuted, fontSize: '0.88em' }}>
            🏫 {a.className} &nbsp;·&nbsp; 👩‍🏫 {a.teacherName}
          </p>
          {a.description && (
            <p style={{ margin: '8px 0 0', color: C.text, fontSize: '0.9em' }}>{a.description}</p>
          )}
          <div style={{ marginTop: 10, display: 'flex', gap: 20, fontSize: '0.83em', color: C.textMuted, flexWrap: 'wrap' }}>
            <span>📅 Mở: {fmt(a.openAt)}</span>
            <span>⏰ Hạn: {fmt(a.dueAt)}</span>
            {timeLeft !== null && (
              <span style={{ color: timeLeft < 60 ? C.danger : C.warning, fontWeight: 600 }}>
                ⏳ Còn {timeLeft >= 60 ? `${Math.floor(timeLeft / 60)}h${timeLeft % 60}p` : `${timeLeft} phút`}
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {a.isOpen && !mySubmission && (
            <button style={S.btn(C.student)} onClick={onSubmit}>📤 Nộp bài</button>
          )}
          {a.isOpen && mySubmission?.canEdit && (
            <button style={S.btn(C.warning)} onClick={onSubmit}>✏️ Sửa bài</button>
          )}
          {mySubmission?.score !== undefined && mySubmission.score !== null && (
            <div style={{
              background: '#f0fdf4', border: `1.5px solid ${C.success}`,
              borderRadius: 8, padding: '6px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.3em', fontWeight: 700, color: C.success }}>
                {mySubmission.score}/10
              </div>
              <div style={{ fontSize: '0.75em', color: C.textMuted }}>Điểm</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Grade Card ────────────────────────────────────────────────
function GradeCard({ submission: s }: { submission: MySubmissionDto }) {
  return (
    <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h4 style={{ margin: 0, color: C.text }}>{s.assignmentTitle}</h4>
        <p style={{ margin: '4px 0 0', color: C.textMuted, fontSize: '0.85em' }}>
          🏫 {s.className} &nbsp;·&nbsp; 📎 {s.fileName}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '0.82em', color: C.textLight }}>
          Nộp lúc: {fmt(s.submittedAt)}
          {s.isLate && <span style={{ color: C.danger, marginLeft: 8 }}>· Nộp muộn</span>}
        </p>
        {s.feedback && (
          <p style={{ margin: '8px 0 0', fontSize: '0.88em', color: C.text, background: '#f8fafc', padding: '8px 12px', borderRadius: 6 }}>
            💬 {s.feedback}
          </p>
        )}
      </div>
      <div style={{ textAlign: 'center', minWidth: 70 }}>
        {s.score !== undefined && s.score !== null ? (
          <>
            <div style={{ fontSize: '2em', fontWeight: 700, color: scoreColor(s.score) }}>
              {s.score}
            </div>
            <div style={{ fontSize: '0.75em', color: C.textMuted }}>/10</div>
            {s.gradedAt && <div style={{ fontSize: '0.72em', color: C.textLight, marginTop: 2 }}>{fmtDate(s.gradedAt)}</div>}
          </>
        ) : (
          <span style={S.badge(C.textMuted, '#f1f5f9')}>Chưa chấm</span>
        )}
      </div>
    </div>
  );
}

// ── Submit Modal ──────────────────────────────────────────────
function SubmitModal({ assignment, existingSub, api, onClose }: {
  assignment: AssignmentDto;
  existingSub?: MySubmissionDto;
  api: ReturnType<typeof useApi>;
  onClose: () => void;
}) {
  const [file, setFile]     = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async () => {
    if (!file) { setError('Vui lòng chọn file'); return; }
    setLoading(true); setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      if (existingSub) {
        await api.put(`/student/assignments/submissions/${existingSub.id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post(`/student/assignments/${assignment.id}/submit`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Lỗi khi nộp bài');
    } finally { setLoading(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ ...S.card, width: 440, padding: '28px 32px' }}>
        <h3 style={{ margin: '0 0 6px', color: C.text }}>
          {existingSub ? '✏️ Sửa bài nộp' : '📤 Nộp bài'}
        </h3>
        <p style={{ margin: '0 0 20px', color: C.textMuted, fontSize: '0.88em' }}>
          {assignment.title} · Hạn: {fmt(assignment.dueAt)}
        </p>

        {existingSub && (
          <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.88em' }}>
            📎 File hiện tại: <strong>{existingSub.fileName}</strong>
          </div>
        )}

        <label style={S.label}>Chọn file</label>
        <input
          type="file"
          style={{ ...S.input, padding: '7px 10px' }}
          onChange={e => setFile(e.target.files?.[0] || null)}
        />

        {file && (
          <p style={{ margin: '8px 0 0', fontSize: '0.85em', color: C.textMuted }}>
            📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}

        {error && <p style={{ color: C.danger, fontSize: '0.88em', marginTop: 10 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button style={S.btnOutline()} onClick={onClose}>Hủy</button>
          <button style={S.btn(C.student)} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang nộp...' : existingSub ? 'Cập nhật' : 'Nộp bài'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function fmt(d: string) {
  return new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN');
}
function scoreColor(s: number) {
  if (s >= 8) return C.success;
  if (s >= 6) return C.warning;
  return C.danger;
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
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  );
}
