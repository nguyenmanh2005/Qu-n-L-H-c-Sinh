// src/features/admin/AdminGrades.tsx
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

function useApi() {
  const token = useAuthStore((s) => s.token);
  return useMemo(() => axios.create({
    baseURL: 'http://localhost:5187/api',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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

interface SubmissionItem {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  fileName: string;
  submittedAt: string;
  isLate: boolean;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  isGraded: boolean;
}

function fmt(d: string) {
  return new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'ok' | 'err'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold
      ${type === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`}>
      <span className="text-base">{type === 'ok' ? '✓' : '✕'}</span>
      <span>{msg}</span>
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

// ── Score badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 8
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : score >= 6.5 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-500 bg-red-50 border-red-200';
  const barColor = score >= 8 ? '#10b981' : score >= 6.5 ? '#f59e0b' : '#ef4444';
  return (
    <div className={`border rounded-xl px-3 py-1.5 text-center min-w-[58px] ${cls}`}>
      <div className="text-xl font-black leading-tight">{score}</div>
      <div className="text-xs text-slate-400 leading-none">/10</div>
      <div className="w-full bg-slate-200 rounded-full h-1 mt-1">
        <div style={{ width: `${score * 10}%`, background: barColor, height: '100%', borderRadius: 999 }} />
      </div>
    </div>
  );
}

export default function AdminGrades() {
  const api = useApi();

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');

  const [selected, setSelected]       = useState<AssignmentItem | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [subLoading, setSubLoading]   = useState(false);

  // Grading state
  const [grading, setGrading]         = useState<number | null>(null);
  const [gradeScore, setGradeScore]   = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradeLoading, setGradeLoading]   = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/assignments');
      setAssignments(res.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  const openSubs = async (a: AssignmentItem) => {
    setSelected(a);
    setGrading(null);
    setSubLoading(true);
    try {
      const res = await api.get(`/admin/assignments/${a.id}/submissions`);
      setSubmissions(res.data || []);
    } catch { setSubmissions([]); }
    finally { setSubLoading(false); }
  };

  const deleteSub = async (id: number) => {
    if (!confirm('Xóa bài nộp này?')) return;
    try {
      await api.delete(`/admin/assignments/submissions/${id}`);
      setSubmissions(p => p.filter(s => s.id !== id));
      setToast({ msg: 'Đã xóa bài nộp', type: 'ok' });
    } catch { setToast({ msg: 'Lỗi khi xóa', type: 'err' }); }
  };

  const deleteAssignment = async (id: number) => {
    if (!confirm('Xóa bài tập này và TẤT CẢ bài nộp?')) return;
    try {
      await api.delete(`/admin/assignments/${id}`);
      if (selected?.id === id) setSelected(null);
      load();
      setToast({ msg: 'Đã xóa bài tập', type: 'ok' });
    } catch { setToast({ msg: 'Lỗi khi xóa', type: 'err' }); }
  };

  const startGrade = (s: SubmissionItem) => {
    setGrading(s.id);
    setGradeScore(s.score?.toString() ?? '');
    setGradeFeedback(s.feedback ?? '');
  };

  const saveGrade = async (submissionId: number) => {
    const score = parseFloat(gradeScore);
    if (isNaN(score) || score < 0 || score > 10) {
      setToast({ msg: 'Điểm phải từ 0 đến 10', type: 'err' }); return;
    }
    setGradeLoading(true);
    try {
      // Admin dùng chung endpoint teacher để chấm điểm
      await api.post(`/admin/assignments/submissions/${submissionId}/grade`, {
        score,
        feedback: gradeFeedback || null,
      });
      if (selected) {
        const res = await api.get(`/admin/assignments/${selected.id}/submissions`);
        setSubmissions(res.data || []);
      }
      setGrading(null);
      setToast({ msg: 'Đã lưu điểm thành công', type: 'ok' });
    } catch { setToast({ msg: 'Lỗi khi lưu điểm', type: 'err' }); }
    finally { setGradeLoading(false); }
  };

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.className.toLowerCase().includes(search.toLowerCase()) ||
    (a.teacherName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalSubs = assignments.reduce((n, a) => n + a.submissionCount, 0);
  const openCount = assignments.filter(a => a.isOpen).length;

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
      <div className="text-5xl">📊</div>
      <div className="font-semibold text-lg">Đang tải...</div>
    </div>
  );

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">📝 Bài tập & Điểm số</h1>
        <p className="text-sm text-slate-400 mt-1">Xem, chấm và sửa điểm tất cả bài tập trong hệ thống</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Tổng bài tập', value: assignments.length, icon: '📋', from: 'from-indigo-500', to: 'to-violet-600' },
          { label: 'Đang mở',      value: openCount,          icon: '🟢', from: 'from-emerald-500', to: 'to-teal-600' },
          { label: 'Tổng bài nộp', value: totalSubs,          icon: '📤', from: 'from-amber-500',   to: 'to-orange-500' },
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

      {/* Layout */}
      <div className={`grid gap-5 ${selected ? 'grid-cols-[1fr_1.3fr]' : 'grid-cols-1'}`}>

        {/* ── Left: assignment list ── */}
        <div>
          <input
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3 placeholder:text-slate-300 bg-white"
            placeholder="🔍 Tìm theo tên bài, lớp, giáo viên..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {filtered.length === 0 && (
            <div className="text-center py-14 text-slate-400">
              <div className="text-4xl mb-2">📭</div>
              <div className="font-semibold text-sm">Không có bài tập nào</div>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map(a => {
              const isActive   = selected?.id === a.id;
              const borderLeft = a.isExpired ? 'border-l-red-400' : a.isOpen ? 'border-l-emerald-400' : 'border-l-amber-400';
              const statusPill = a.isExpired
                ? 'bg-red-50 text-red-500 border border-red-200'
                : a.isOpen ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-amber-50 text-amber-600 border border-amber-200';
              const statusText = a.isExpired ? 'Đã đóng' : a.isOpen ? 'Đang mở' : 'Chưa mở';

              return (
                <div key={a.id} onClick={() => openSubs(a)}
                  className={`bg-white rounded-xl border border-l-4 ${borderLeft} border-slate-100 shadow-sm p-3.5 cursor-pointer transition-all
                    ${isActive ? 'ring-2 ring-indigo-400 ring-offset-1 border-slate-200' : 'hover:shadow-md hover:border-slate-200'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-800 text-sm">{a.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusPill}`}>{statusText}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        🏫 {a.className}
                        {a.teacherName && <span> · 👩‍🏫 {a.teacherName}</span>}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        ⏰ {fmt(a.dueAt)}
                        <span className="ml-2 font-semibold text-indigo-500">· {a.submissionCount} bài nộp</span>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteAssignment(a.id); }}
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition text-sm"
                      title="Xóa bài tập"
                    >🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: submissions + grading panel ── */}
        {selected && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800">📝 Bài nộp & Chấm điểm</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selected.title} · {selected.className}</p>
              </div>
              <button onClick={() => { setSelected(null); setGrading(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 transition text-xl leading-none">
                ×
              </button>
            </div>

            {/* Submissions list */}
            <div className="overflow-y-auto flex-1 max-h-[70vh] p-4 space-y-3">
              {subLoading && (
                <div className="text-center py-10 text-slate-400 text-sm">Đang tải...</div>
              )}
              {!subLoading && submissions.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-3xl mb-2">📭</div>
                  <div className="text-sm font-semibold">Chưa có bài nộp</div>
                </div>
              )}

              {submissions.map(s => (
                <div key={s.id} className="border border-slate-100 rounded-xl p-3.5 hover:border-slate-200 transition">
                  {/* Row top */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 text-sm">{s.studentName}</div>
                      <div className="text-xs text-slate-400">{s.studentEmail}</div>
                      <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3">
                        <span>📎 {s.fileName}</span>
                        <span>Nộp: {fmt(s.submittedAt)}</span>
                        {s.isLate && <span className="text-red-500 font-semibold">Muộn</span>}
                      </div>
                      {s.feedback && grading !== s.id && (
                        <div className="mt-1.5 text-xs bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-slate-500 italic">
                          💬 {s.feedback}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Score display */}
                      {s.isGraded && grading !== s.id && <ScoreBadge score={s.score!} />}

                      {/* Buttons */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => grading === s.id ? setGrading(null) : startGrade(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition
                            ${grading === s.id
                              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
                        >
                          {grading === s.id ? 'Hủy' : s.isGraded ? '✏️ Sửa điểm' : '+ Chấm điểm'}
                        </button>
                        <button
                          onClick={() => deleteSub(s.id)}
                          className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 transition text-center"
                        >🗑️ Xóa</button>
                      </div>
                    </div>
                  </div>

                  {/* Inline grade form */}
                  {grading === s.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex gap-2 flex-wrap items-end">
                        <div className="w-28">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Điểm (0–10)
                          </label>
                          <input
                            type="number" min={0} max={10} step={0.5}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                            placeholder="VD: 8.5"
                            value={gradeScore}
                            onChange={e => setGradeScore(e.target.value)}
                          />
                        </div>
                        <div className="flex-1 min-w-[140px]">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Nhận xét
                          </label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                            placeholder="Tùy chọn..."
                            value={gradeFeedback}
                            onChange={e => setGradeFeedback(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveGrade(s.id)}
                          />
                        </div>
                        <button
                          onClick={() => saveGrade(s.id)}
                          disabled={gradeLoading}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition flex-shrink-0"
                        >
                          {gradeLoading ? '...' : '✓ Lưu điểm'}
                        </button>
                      </div>

                      {/* Live preview */}
                      {gradeScore && !isNaN(parseFloat(gradeScore)) && (
                        <div className="mt-2 text-xs text-slate-400">
                          Xem trước: &nbsp;
                          <span className={`font-bold ${parseFloat(gradeScore) >= 8 ? 'text-emerald-600' : parseFloat(gradeScore) >= 6.5 ? 'text-amber-500' : 'text-red-500'}`}>
                            {parseFloat(gradeScore)}/10
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 