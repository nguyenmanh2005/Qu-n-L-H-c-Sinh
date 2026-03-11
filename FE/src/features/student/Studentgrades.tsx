// src/features/student/StudentGrades.tsx
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

function useApi() {
  const token = useAuthStore((s) => s.token);
  return useMemo(() => axios.create({
    baseURL: 'http://localhost:5187/api',
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);
}

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

type SubTab = 'assignments' | 'grades';

function fmt(d: string) {
  return new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function ScoreDisplay({ score }: { score: number }) {
  const color = score >= 8
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : score >= 6.5
    ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-500 bg-red-50 border-red-200';
  const barColor = score >= 8 ? '#10b981' : score >= 6.5 ? '#f59e0b' : '#ef4444';
  return (
    <div className={`border rounded-xl px-3 py-2 text-center min-w-[64px] ${color}`}>
      <div className="text-2xl font-black leading-tight">{score}</div>
      <div className="text-xs text-slate-400 leading-none">/10</div>
      <div className="w-full bg-slate-200 rounded-full h-1 mt-1.5">
        <div style={{ width: `${score * 10}%`, background: barColor, height: '100%', borderRadius: 999 }} />
      </div>
    </div>
  );
}

function SubmitModal({ assignment, existingSub, api, onClose }: {
  assignment: AssignmentItem;
  existingSub?: MySubmission;
  api: ReturnType<typeof useApi>;
  onClose: () => void;
}) {
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
        await api.put(`/student/assignments/submissions/${existingSub.id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post(`/student/assignments/${assignment.id}/submit`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Lỗi khi nộp bài');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-base">
            {existingSub ? '✏️ Sửa bài nộp' : '📤 Nộp bài'}
          </h3>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm">
            <div className="font-semibold text-slate-700">{assignment.title}</div>
            <div className="text-slate-400 text-xs mt-1">
              🏫 {assignment.className} &nbsp;·&nbsp; ⏰ Hạn: {fmt(assignment.dueAt)}
            </div>
          </div>

          {existingSub && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-sm text-emerald-700">
              📎 File hiện tại: <strong>{existingSub.fileName}</strong>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {existingSub ? 'Chọn file mới' : 'Chọn file nộp'}
            </label>
            <input
              type="file"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
            />
            {file && (
              <p className="mt-1.5 text-xs text-slate-400">
                📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm">
              ❌ {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
              Hủy
            </button>
            <button onClick={submit} disabled={loading}
              className="px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition">
              {loading ? '⏳ Đang nộp...' : existingSub ? '💾 Cập nhật' : '📤 Nộp bài'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentGrades() {
  const api = useApi();
  const { user } = useAuthStore();

  const [subTab, setSubTab]           = useState<SubTab>('assignments');
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
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const subMap    = new Map(submissions.map(s => [s.assignmentId, s]));
  const graded    = submissions.filter(s => s.score !== undefined && s.score !== null);
  const avgScore  = graded.length > 0
    ? (graded.reduce((n, s) => n + (s.score ?? 0), 0) / graded.length).toFixed(1)
    : null;
  const openCount = assignments.filter(a => a.isOpen && !subMap.has(a.id)).length;

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
      <div className="text-5xl">📚</div>
      <div className="font-semibold text-lg">Đang tải bài tập...</div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">📚 Bài tập & Điểm số</h1>
        <p className="text-sm text-slate-400 mt-1">Xin chào, {user?.fullName || user?.username}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng bài tập',    value: assignments.length,                          icon: '📋', from: 'from-violet-500', to: 'to-purple-600' },
          { label: 'Cần nộp',         value: openCount,                                   icon: '⚡', from: 'from-red-500',    to: 'to-rose-600'   },
          { label: 'Đã nộp',          value: submissions.length,                          icon: '✅', from: 'from-emerald-500', to: 'to-teal-600'  },
          { label: 'Điểm trung bình', value: avgScore ? `${avgScore}/10` : '—',           icon: '⭐', from: 'from-amber-500',  to: 'to-orange-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${s.from} ${s.to}`} />
            <div className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center text-white text-lg flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <div className="text-xl font-black text-slate-800">{s.value}</div>
                <div className="text-xs text-slate-400 font-semibold">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 w-fit">
        {([
          { key: 'assignments' as SubTab, label: '📋 Bài tập' },
          { key: 'grades'      as SubTab, label: '🏆 Điểm của tôi' },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => setSubTab(key)}
            className={`py-2 px-5 rounded-lg text-sm font-semibold transition-all
              ${subTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Bài tập ── */}
      {subTab === 'assignments' && (
        <div className="space-y-3">
          {assignments.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <div className="text-5xl mb-3">📭</div>
              <div className="font-semibold">Chưa có bài tập nào</div>
            </div>
          )}
          {assignments.map(a => {
            const mySub = subMap.get(a.id);
            const now   = new Date();
            const dueAt = new Date(a.dueAt);
            const mins  = Math.max(0, Math.floor((dueAt.getTime() - now.getTime()) / 60000));
            const borderLeft = a.isExpired ? 'border-l-red-400' : a.isOpen ? 'border-l-emerald-400' : 'border-l-amber-400';
            const statusPill = a.isExpired
              ? 'bg-red-50 text-red-500 border border-red-200'
              : a.isOpen ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-amber-50 text-amber-600 border border-amber-200';
            const statusText = a.isExpired ? 'Đã đóng' : a.isOpen ? 'Đang mở' : 'Chưa mở';

            return (
              <div key={a.id}
                className={`bg-white rounded-xl border border-l-4 ${borderLeft} border-slate-100 shadow-sm p-4`}>
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-bold text-slate-800">{a.title}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${statusPill}`}>{statusText}</span>
                      {mySub && <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">✓ Đã nộp</span>}
                      {mySub?.isLate && <span className="text-xs bg-red-50 text-red-500 border border-red-200 px-2.5 py-0.5 rounded-full font-semibold">Muộn</span>}
                    </div>
                    <div className="text-xs text-slate-400 mb-1.5">
                      🏫 {a.className}{a.teacherName && <span> &nbsp;·&nbsp; 👩‍🏫 {a.teacherName}</span>}
                    </div>
                    {a.description && <div className="text-sm text-slate-500 mb-2 line-clamp-2">{a.description}</div>}
                    <div className="flex gap-4 text-xs text-slate-400 flex-wrap">
                      <span>📅 Mở: {fmt(a.openAt)}</span>
                      <span>⏰ Hạn: {fmt(a.dueAt)}</span>
                      {a.isOpen && !a.isExpired && (
                        <span className={`font-bold ${mins < 60 ? 'text-red-500' : mins < 24 * 60 ? 'text-amber-500' : 'text-slate-500'}`}>
                          ⏳ Còn {mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60}p` : `${mins}p`}
                        </span>
                      )}
                    </div>
                    {mySub && (
                      <div className="mt-2 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-1.5 inline-flex gap-3 flex-wrap">
                        <span>📎 {mySub.fileName}</span>
                        <span>Nộp lúc {fmt(mySub.submittedAt)}</span>
                        {mySub.score !== undefined && mySub.score !== null && (
                          <span className={`font-bold ${mySub.score >= 8 ? 'text-emerald-600' : mySub.score >= 6.5 ? 'text-amber-500' : 'text-red-500'}`}>
                            Điểm: {mySub.score}/10
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 items-start flex-wrap">
                    {a.isOpen && !mySub && (
                      <button onClick={() => setSubmitModal(a)}
                        className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition">
                        📤 Nộp bài
                      </button>
                    )}
                    {a.isOpen && mySub?.canEdit && (
                      <button onClick={() => setEditModal({ assignment: a, sub: mySub })}
                        className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-lg hover:bg-amber-600 transition">
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
        <div className="space-y-3">
          {submissions.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <div className="text-5xl mb-3">📭</div>
              <div className="font-semibold">Chưa có bài nộp nào</div>
            </div>
          )}
          {submissions.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-slate-800">{s.assignmentTitle}</span>
                    {s.isLate && (
                      <span className="text-xs bg-red-50 text-red-500 border border-red-200 px-2.5 py-0.5 rounded-full font-semibold">Nộp muộn</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">🏫 {s.className} &nbsp;·&nbsp; 📎 {s.fileName}</div>
                  <div className="text-xs text-slate-400">
                    Nộp lúc: {fmt(s.submittedAt)}
                    {s.gradedAt && <span className="ml-2">· Chấm ngày: {new Date(s.gradedAt).toLocaleDateString('vi-VN')}</span>}
                  </div>
                  {s.feedback && (
                    <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm text-slate-600 italic">
                      💬 {s.feedback}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {s.score !== undefined && s.score !== null
                    ? <ScoreDisplay score={s.score} />
                    : <span className="text-xs bg-slate-50 text-slate-400 border border-slate-200 px-3 py-2 rounded-xl font-semibold whitespace-nowrap">Chưa chấm</span>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {submitModal && (
        <SubmitModal assignment={submitModal} api={api} onClose={() => { setSubmitModal(null); loadAll(); }} />
      )}
      {editModal && (
        <SubmitModal assignment={editModal.assignment} existingSub={editModal.sub} api={api} onClose={() => { setEditModal(null); loadAll(); }} />
      )}
    </div>
  );
}