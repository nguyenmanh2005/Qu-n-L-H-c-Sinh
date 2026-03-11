// src/features/teacher/components/GradesTab.tsx
import { useEffect, useState } from 'react';
import { useTeacherApi } from '../hooks/useTeacherApi';
import type { ClassInfo } from '../TeacherDashboard';

interface Props {
  allClasses: ClassInfo[];
}

export default function GradesTab({ allClasses }: Props) {
  const api = useTeacherApi();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(
    allClasses[0]?.id ?? null
  );
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [gradeInputs, setGradeInputs] = useState<Record<number, { score: string; feedback: string }>>({});
  const [loading, setLoading] = useState(false);
  const [subsLoading, setSubsLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  useEffect(() => {
    if (selectedClassId) loadAssignments(selectedClassId);
    setSelectedAssignment(null);
    setSubmissions([]);
  }, [selectedClassId]);

  const loadAssignments = async (classId: number) => {
    setLoading(true);
    try {
      const res = await api.get('/assignments');
      const filtered = (res.data || []).filter((a: any) => a.classId === classId);
      setAssignments(filtered);
    } catch {
      showMsg('Lỗi tải danh sách bài tập', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = selectedAssignment?.isExpired === true;

  const openSubmissions = async (assignment: any) => {
    setSelectedAssignment(assignment);
    setSubsLoading(true);
    try {
      const res = await api.get(`/assignments/${assignment.id}/submissions`);
      setSubmissions(res.data || []);
      const inputs: Record<number, { score: string; feedback: string }> = {};
      (res.data || []).forEach((s: any) => {
        inputs[s.id] = { score: s.score ?? '', feedback: s.feedback ?? '' };
      });
      setGradeInputs(inputs);
    } catch {
      showMsg('Lỗi tải bài nộp', 'error');
    } finally {
      setSubsLoading(false);
    }
  };

  const submitGrade = async (submissionId: number) => {
    if (selectedAssignment?.isExpired) {
      showMsg('🔒 Bài tập đã đóng, không thể sửa điểm.', 'error');
      return;
    }
    const g = gradeInputs[submissionId];
    const score = parseFloat(g?.score);
    if (isNaN(score) || score < 0 || score > 10) {
      showMsg('Điểm phải từ 0–10', 'error');
      return;
    }
    try {
      await api.post(`/assignments/submissions/${submissionId}/grade`, {
        score,
        feedback: g?.feedback || '',
      });
      showMsg('✅ Đã lưu điểm', 'success');
      await openSubmissions(selectedAssignment);
    } catch {
      showMsg('Lỗi chấm điểm', 'error');
    }
  };

  const thStyle: React.CSSProperties = {
    background: '#fff5f5', color: '#c0392b', fontWeight: 600,
    padding: '10px 12px', border: '1px solid #eee', textAlign: 'left', fontSize: '0.93em',
  };
  const tdStyle: React.CSSProperties = {
    padding: '10px 12px', border: '1px solid #eee', fontSize: '0.93em', verticalAlign: 'middle',
  };

  const selectedClass = allClasses.find(c => c.id === selectedClassId);

  return (
    <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 25, marginBottom: 30 }}>
      <h2 style={{ marginTop: 0 }}>📊 Xem điểm số học sinh</h2>

      {/* Class selector */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 600, color: '#555' }}>Chọn lớp:</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {allClasses.map(cls => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600,
                background: selectedClassId === cls.id ? '#ff6b6b' : '#f0f0f0',
                color: selectedClassId === cls.id ? 'white' : '#555',
                transition: 'all 0.2s',
              }}
            >
              {cls.name}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, margin: '12px 0', textAlign: 'center', fontWeight: 'bold',
          background: msg.type === 'success' ? '#d4edda' : '#f8d7da',
          color: msg.type === 'success' ? '#155724' : '#721c24',
        }}>{msg.text}</div>
      )}

      {!selectedClassId ? (
        <p style={{ textAlign: 'center', color: '#aaa', padding: 30 }}>Chọn một lớp để xem điểm.</p>
      ) : selectedAssignment ? (
        /* ── Submissions view ── */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedAssignment(null)}
              style={{ padding: '6px 14px', background: '#eee', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
            >← Quay lại</button>
            <h3 style={{ margin: 0, color: '#c0392b' }}>📝 {selectedAssignment.title}</h3>
            <span style={{ fontSize: '0.85em', color: '#888' }}>
              Hạn: {new Date(selectedAssignment.dueAt).toLocaleString('vi-VN')}
            </span>
          </div>

          {subsLoading ? (
            <p style={{ textAlign: 'center', color: '#777' }}>Đang tải...</p>
          ) : !submissions.length ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>
              <div style={{ fontSize: '2em' }}>📭</div>
              <p>Chưa có học sinh nào nộp bài.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {isLocked && (
                <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 14, background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.2em' }}>🔒</span>
                  Bài tập đã đóng — chỉ xem, không thể sửa điểm.
                </div>
              )}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['#', 'Học sinh', 'File', 'Nộp lúc', 'Trạng thái', 'Điểm', 'Nhận xét', ...(isLocked ? [] : ['Hành động'])].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, i) => (
                    <tr key={s.id} style={{ background: s.isLate ? '#fff8f0' : '' }}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={tdStyle}>
                        <strong>{s.studentName}</strong><br />
                        <span style={{ color: '#888', fontSize: '0.82em' }}>{s.studentEmail}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.88em', color: '#3498db' }}>{s.fileName}</span>
                        {s.isLate && <span style={{ display: 'block', fontSize: '0.78em', color: '#e67e22', fontWeight: 'bold' }}>⚠ Nộp trễ</span>}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.85em' }}>{new Date(s.submittedAt).toLocaleString('vi-VN')}</span>
                      </td>
                      <td style={tdStyle}>
                        {s.isGraded
                          ? <span style={{ background: '#d4edda', color: '#155724', padding: '3px 8px', borderRadius: 10, fontWeight: 'bold', fontSize: '0.82em' }}>✅ Đã chấm</span>
                          : <span style={{ background: '#fff3cd', color: '#856404', padding: '3px 8px', borderRadius: 10, fontWeight: 'bold', fontSize: '0.82em' }}>⏳ Chờ chấm</span>
                        }
                      </td>
                      <td style={{ ...tdStyle, minWidth: 80 }}>
                        {isLocked ? (
                          <span style={{ fontWeight: 700, color: gradeInputs[s.id]?.score !== '' ? '#c0392b' : '#aaa' }}>
                            {gradeInputs[s.id]?.score !== '' ? gradeInputs[s.id]?.score : '—'}
                          </span>
                        ) : (
                          <input
                            type="number" min={0} max={10} step={0.5}
                            value={gradeInputs[s.id]?.score ?? ''}
                            onChange={e => setGradeInputs(prev => ({ ...prev, [s.id]: { ...prev[s.id], score: e.target.value } }))}
                            placeholder="0–10"
                            style={{ width: 70, padding: '5px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9em' }}
                          />
                        )}
                      </td>
                      <td style={{ ...tdStyle, minWidth: 140 }}>
                        {isLocked ? (
                          <span style={{ color: '#555', fontSize: '0.9em' }}>{gradeInputs[s.id]?.feedback || '—'}</span>
                        ) : (
                          <input
                            type="text"
                            value={gradeInputs[s.id]?.feedback ?? ''}
                            onChange={e => setGradeInputs(prev => ({ ...prev, [s.id]: { ...prev[s.id], feedback: e.target.value } }))}
                            placeholder="Nhận xét..."
                            style={{ width: '100%', padding: '5px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9em' }}
                          />
                        )}
                      </td>
                      {!isLocked && (
                        <td style={tdStyle}>
                          <button
                            onClick={() => submitGrade(s.id)}
                            style={{ padding: '6px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.88em', whiteSpace: 'nowrap' }}
                          >💾 Lưu điểm</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ── Assignment list ── */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0, color: '#c0392b' }}>
              📚 Bài tập — Lớp <strong>{selectedClass?.name}</strong>
            </h3>
            <button
              onClick={() => loadAssignments(selectedClassId!)}
              style={{ padding: '7px 14px', background: '#3498db', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.9em' }}
            >🔄 Làm mới</button>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#777' }}>Đang tải...</p>
          ) : !assignments.length ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>
              <div style={{ fontSize: '2em' }}>📂</div>
              <p>Lớp này chưa có bài tập nào.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['#', 'Tiêu đề', 'Trạng thái', 'Mở lúc', 'Hạn nộp', 'Bài nộp', 'Hành động'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a, i) => (
                    <tr key={a.id}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={tdStyle}>
                        <strong>{a.title}</strong>
                        {a.description && <div style={{ fontSize: '0.82em', color: '#888', marginTop: 2 }}>{a.description}</div>}
                      </td>
                      <td style={tdStyle}>
                        {a.isOpen
                          ? <span style={{ background: '#d4edda', color: '#155724', padding: '3px 8px', borderRadius: 10, fontSize: '0.82em', fontWeight: 'bold' }}>🟢 Đang mở</span>
                          : a.isExpired
                            ? <span style={{ background: '#f8d7da', color: '#721c24', padding: '3px 8px', borderRadius: 10, fontSize: '0.82em', fontWeight: 'bold' }}>🔴 Đã đóng</span>
                            : <span style={{ background: '#fff3cd', color: '#856404', padding: '3px 8px', borderRadius: 10, fontSize: '0.82em', fontWeight: 'bold' }}>🟡 Chưa mở</span>
                        }
                      </td>
                      <td style={{ ...tdStyle, fontSize: '0.85em' }}>{new Date(a.openAt).toLocaleString('vi-VN')}</td>
                      <td style={{ ...tdStyle, fontSize: '0.85em' }}>{new Date(a.dueAt).toLocaleString('vi-VN')}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ background: '#e8f4fd', color: '#1a5276', padding: '3px 10px', borderRadius: 10, fontWeight: 'bold' }}>{a.submissionCount}</span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => openSubmissions(a)}
                          style={{ padding: '5px 12px', background: '#3498db', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: '0.88em', whiteSpace: 'nowrap' }}
                        >👁 Xem & Chấm điểm</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}