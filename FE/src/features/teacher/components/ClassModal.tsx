// src/features/teacher/components/ClassModal.tsx
import { useEffect, useState, useRef } from 'react';
import { useTeacherApi } from '../hooks/useTeacherApi';
import type { ClassInfo } from '../TeacherDashboard';

type ModalTab = 'students' | 'attendance' | 'history' | 'edit';

interface Props {
  classInfo: ClassInfo;
  onClose: () => void;
}

function statusBadge(status: string) {
  if (status === 'Pending')  return <span style={{ background: '#fff3cd', color: '#856404', padding: '3px 8px', borderRadius: 12, fontSize: '0.82em', fontWeight: 'bold' }}>⏳ Chờ duyệt</span>;
  if (status === 'Approved') return <span style={{ background: '#d4edda', color: '#155724', padding: '3px 8px', borderRadius: 12, fontSize: '0.82em', fontWeight: 'bold' }}>✅ Đã duyệt</span>;
  return <span style={{ background: '#f8d7da', color: '#721c24', padding: '3px 8px', borderRadius: 12, fontSize: '0.82em', fontWeight: 'bold' }}>❌ Từ chối</span>;
}

function Msg({ text, type }: { text: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 8, margin: '12px 0', textAlign: 'center', fontWeight: 'bold',
      background: type === 'success' ? '#d4edda' : '#f8d7da',
      color: type === 'success' ? '#155724' : '#721c24',
    }}>{text}</div>
  );
}

export default function ClassModal({ classInfo, onClose }: Props) {
  const api = useTeacherApi();
  const classId = classInfo.id;
  const [tab, setTab] = useState<ModalTab>('students');

  // Students
  const [students, setStudents] = useState<any[]>([]);
  const [studLoading, setStudLoading] = useState(true);
  const [globalMsg, setGlobalMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Attendance
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStudents, setAttStudents] = useState<any[]>([]);
  const [attMap, setAttMap] = useState<Record<string, boolean>>({});
  const [attLoaded, setAttLoaded] = useState(false);
  const [attSaveMsg, setAttSaveMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // History
  const now = new Date();
  const [histMonth, setHistMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [histData, setHistData] = useState<any>(null);
  const [histLoading, setHistLoading] = useState(false);

  // Edit
  const [editName, setEditName] = useState(classInfo.name || '');
  const [editSchedule, setEditSchedule] = useState(classInfo.schedule || '');
  const [editStartDate, setEditStartDate] = useState(classInfo.startDate ? classInfo.startDate.substring(0, 16) : '');
  const [editMsg, setEditMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load students on mount
  useEffect(() => { loadStudents(); }, [classId]);

  const showGlobal = (text: string, type: 'success' | 'error') => {
    setGlobalMsg({ text, type });
    setTimeout(() => setGlobalMsg(null), 6000);
  };

  const loadStudents = async () => {
    setStudLoading(true);
    try {
      const res = await api.get(`/classes/${classId}/students`);
      setStudents(res.data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setStudLoading(false);
    }
  };

  const approveEnrollment = async (enrollmentId: number) => {
    if (!confirm('Chấp nhận học sinh này?')) return;
    try {
      await api.post(`/enrollments/${enrollmentId}/approve`, {});
      showGlobal('✅ Đã chấp nhận học sinh', 'success');
      await loadStudents();
    } catch { showGlobal('❌ Duyệt thất bại', 'error'); }
  };

  const rejectEnrollment = async (enrollmentId: number) => {
    if (!confirm('Từ chối yêu cầu này?')) return;
    try {
      await api.post(`/enrollments/${enrollmentId}/reject`, {});
      showGlobal('✅ Đã từ chối yêu cầu', 'success');
      await loadStudents();
    } catch { showGlobal('❌ Từ chối thất bại', 'error'); }
  };

  const loadAttendance = async () => {
    if (!attDate) { alert('Vui lòng chọn ngày'); return; }
    try {
      const studRes = await api.get(`/classes/${classId}/students`);
      const approved = (studRes.data.students || []).filter((s: any) => s.status === 'Approved');
      setAttStudents(approved);

      const dateISO = new Date(attDate + 'T00:00:00').toISOString();
      let map: Record<string, boolean> = {};
      try {
        const attRes = await api.get(`/classes/${classId}/attendance?date=${encodeURIComponent(dateISO)}`);
        (attRes.data || []).forEach((a: any) => { map[a.studentId] = a.present; });
      } catch {}
      setAttMap(map);
      setAttLoaded(true);
    } catch (err) {
      alert('Lỗi tải danh sách');
    }
  };

  const saveAttendance = async () => {
    if (!attDate) { alert('Chọn ngày trước khi lưu'); return; }
    if (!attStudents.length) { alert('Hãy tải danh sách trước'); return; }
    const entries = attStudents.map(s => ({ studentId: s.studentId, present: attMap[s.studentId] ?? false }));
    try {
      await api.post(`/classes/${classId}/attendance`, {
        date: new Date(attDate + 'T00:00:00').toISOString(), entries,
      });
      setAttSaveMsg({ text: `✅ Đã lưu điểm danh ngày ${new Date(attDate).toLocaleDateString('vi-VN')} thành công!`, type: 'success' });
      setTimeout(() => setAttSaveMsg(null), 5000);
    } catch (e: any) {
      setAttSaveMsg({ text: '❌ ' + (e.message || 'Lỗi khi lưu'), type: 'error' });
    }
  };

  const checkAll = (val: boolean) => {
    const newMap: Record<string, boolean> = {};
    attStudents.forEach(s => { newMap[s.studentId] = val; });
    setAttMap(newMap);
  };

  const presentCount = attStudents.filter(s => attMap[s.studentId]).length;
  const absentCount = attStudents.length - presentCount;

  const loadHistory = async () => {
    if (!histMonth) return;
    setHistLoading(true);
    setHistData(null);
    try {
      const studRes = await api.get(`/classes/${classId}/students`);
      const approved = (studRes.data.students || []).filter((s: any) => s.status === 'Approved');
      const [year, month] = histMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();

      const studentMap: Record<string, { name: string; present: number; absent: number }> = {};
      approved.forEach((s: any) => { studentMap[s.studentId] = { name: s.studentName, present: 0, absent: 0 }; });

      const allDays = await Promise.all(
        Array.from({ length: daysInMonth }, (_, i) => i + 1).map(async d => {
          const dateISO = new Date(year, month - 1, d).toISOString();
          try {
            const r = await api.get(`/classes/${classId}/attendance?date=${encodeURIComponent(dateISO)}`);
            return { day: d, recs: r.data || [] };
          } catch { return { day: d, recs: [] }; }
        })
      );

      const dayData: { day: number; presentCount: number; absentCount: number }[] = [];
      allDays.forEach(({ day, recs }) => {
        if (!recs.length) return;
        dayData.push({ day, presentCount: recs.filter((r: any) => r.present).length, absentCount: recs.filter((r: any) => !r.present).length });
        recs.forEach((r: any) => {
          if (studentMap[r.studentId]) {
            if (r.present) studentMap[r.studentId].present++;
            else studentMap[r.studentId].absent++;
          }
        });
      });

      setHistData({ year, month, dayData, studentMap });
    } finally {
      setHistLoading(false);
    }
  };

  const saveEdit = async () => {
    try {
      await api.put(`/classes/${classId}`, {
        name: editName || null,
        schedule: editSchedule || null,
        startDate: editStartDate || null,
      });
      setEditMsg({ text: '✅ Cập nhật thành công!', type: 'success' });
    } catch (err: any) {
      setEditMsg({ text: '❌ ' + (err.message || 'Cập nhật thất bại'), type: 'error' });
    }
  };

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px', fontSize: '0.92em',
    background: active ? '#ff6b6b' : '#eee',
    color: active ? 'white' : '#333',
    borderRadius: 6, border: 'none', cursor: 'pointer',
  });

  const thStyle: React.CSSProperties = { background: '#fff5f5', color: '#c0392b', fontWeight: 600, padding: '10px 12px', border: '1px solid #eee', textAlign: 'left', fontSize: '0.93em' };
  const tdStyle: React.CSSProperties = { padding: '10px 12px', border: '1px solid #eee', fontSize: '0.93em' };

  return (
    <div
      onClick={e => { if ((e.target as HTMLElement).id === 'modalOverlay') onClose(); }}
      id="modalOverlay"
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        padding: '40px 16px', overflowY: 'auto',
      }}
    >
      <div style={{ background: 'white', borderRadius: 12, padding: 30, width: '100%', maxWidth: 760, position: 'relative' }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 18, fontSize: '1.5em', cursor: 'pointer', background: 'none', border: 'none', color: '#666', padding: 0 }}
        >✕</button>

        <h2 style={{ marginTop: 0, color: '#c0392b' }}>{classInfo.name}</h2>

        {globalMsg && <Msg {...globalMsg} />}

        {/* Modal tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {([
            { key: 'students', label: '👥 Học sinh' },
            { key: 'attendance', label: '📋 Điểm danh' },
            { key: 'history', label: '📊 Lịch sử' },
            // { key: 'edit', label: '✏️ Sửa lớp' },
          ] as { key: ModalTab; label: string }[]).map(({ key, label }) => (
            <button key={key} style={tabBtnStyle(tab === key)} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {/* ── Tab: Students ── */}
        {tab === 'students' && (
          <div>
            {studLoading ? (
              <p style={{ color: '#777' }}>Đang tải...</p>
            ) : !students.length ? (
              <p style={{ textAlign: 'center', color: '#777', padding: 20 }}>Chưa có học sinh nào.</p>
            ) : (
              <>
                <p style={{ color: '#555', marginBottom: 10 }}>
                  Tổng: <strong>{students.length}</strong>
                  &nbsp;·&nbsp;<span style={{ color: '#f39c12' }}>⏳ Chờ duyệt: {students.filter(s => s.status === 'Pending').length}</span>
                  &nbsp;·&nbsp;<span style={{ color: '#27ae60' }}>✅ Đã duyệt: {students.filter(s => s.status === 'Approved').length}</span>
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['#', 'Họ và tên', 'Email', 'Trạng thái', 'Ngày vào', 'Hành động'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.enrollmentId}>
                        <td style={tdStyle}>{i + 1}</td>
                        <td style={tdStyle}><strong>{s.studentName}</strong></td>
                        <td style={{ ...tdStyle, color: '#666' }}>{s.email || '—'}</td>
                        <td style={tdStyle}>{statusBadge(s.status)}</td>
                        <td style={tdStyle}>{s.approvedDate ? new Date(s.approvedDate).toLocaleDateString('vi-VN') : '—'}</td>
                        <td style={tdStyle}>
                          {s.status === 'Pending' ? (
                            <>
                              <button style={{ padding: '5px 10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 4 }} onClick={() => approveEnrollment(s.enrollmentId)}>✔</button>
                              <button style={{ padding: '5px 10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }} onClick={() => rejectEnrollment(s.enrollmentId)}>✘</button>
                            </>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 12, padding: 10, background: '#f0f8ff', borderRadius: 8, fontSize: '0.9em', color: '#555' }}>
                  💡 Để điểm danh, chuyển sang tab <strong>📋 Điểm danh</strong>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Tab: Attendance ── */}
        {tab === 'attendance' && (
          <div>
            {/* Toolbar */}
            <div style={{ background: '#fff8f0', border: '1px solid #ffd8a8', borderRadius: 8, padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontWeight: 600, color: '#555', fontSize: '0.9em' }}>📅 Ngày điểm danh</label>
                <input type="date" value={attDate} onChange={e => { setAttDate(e.target.value); setAttLoaded(false); }} style={{ padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.95em' }} />
              </div>
              <button style={{ padding: '9px 14px', background: '#3498db', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }} onClick={loadAttendance}>🔍 Tải danh sách</button>
              <button style={{ padding: '9px 14px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }} onClick={saveAttendance}>💾 Lưu điểm danh</button>
              <button style={{ padding: '9px 14px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }} onClick={() => checkAll(true)}>✔ Tất cả có mặt</button>
              <button style={{ padding: '9px 14px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }} onClick={() => checkAll(false)}>✘ Tất cả vắng</button>
            </div>

            {/* Stats */}
            {attLoaded && attStudents.length > 0 && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                <div style={{ padding: '10px 18px', borderRadius: 8, fontWeight: 'bold', background: '#d4edda', color: '#155724' }}>✅ Có mặt: {presentCount}</div>
                <div style={{ padding: '10px 18px', borderRadius: 8, fontWeight: 'bold', background: '#f8d7da', color: '#721c24' }}>❌ Vắng: {absentCount}</div>
                <div style={{ padding: '10px 18px', borderRadius: 8, fontWeight: 'bold', background: '#e8f4fd', color: '#1a5276' }}>👥 Tổng: {attStudents.length}</div>
                <div style={{ padding: '10px 18px', borderRadius: 8, fontWeight: 'bold', background: '#f5f5f5', color: '#555' }}>
                  📊 {attStudents.length > 0 ? Math.round(presentCount / attStudents.length * 100) : 0}% có mặt
                </div>
              </div>
            )}

            {/* Table */}
            {!attLoaded ? (
              <p style={{ textAlign: 'center', color: '#aaa', padding: '30px 0' }}>Chọn ngày và nhấn "Tải danh sách".</p>
            ) : !attStudents.length ? (
              <p style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>Chưa có học sinh được duyệt.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 40 }}>#</th>
                    <th style={thStyle}>Họ và tên</th>
                    <th style={thStyle}>Email</th>
                    <th style={{ ...thStyle, width: 110, textAlign: 'center' }}>Có mặt</th>
                  </tr>
                </thead>
                <tbody>
                  {attStudents.map((s, i) => (
                    <tr key={s.studentId} style={{ background: attMap[s.studentId] ? '#f0fff4' : '' }}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={tdStyle}><strong>{s.studentName}</strong></td>
                      <td style={{ ...tdStyle, color: '#666' }}>{s.email || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="checkbox"
                            checked={attMap[s.studentId] ?? false}
                            onChange={e => setAttMap(prev => ({ ...prev, [s.studentId]: e.target.checked }))}
                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                          />
                          <span>{attMap[s.studentId] ? '✅' : '❌'}</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {attSaveMsg && <Msg {...attSaveMsg} />}
          </div>
        )}

        {/* ── Tab: History ── */}
        {tab === 'history' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ fontWeight: 600, color: '#555' }}>Xem tháng:</label>
              <input type="month" value={histMonth} onChange={e => setHistMonth(e.target.value)} style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6, fontSize: '0.95em' }} />
              <button style={{ padding: '8px 14px', background: '#3498db', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }} onClick={loadHistory}>🔍 Xem</button>
            </div>

            {histLoading && <p style={{ textAlign: 'center', color: '#777' }}>Đang tải...</p>}

            {!histLoading && !histData && (
              <p style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>Chọn tháng để xem lịch sử điểm danh.</p>
            )}

            {histData && !histData.dayData.length && (
              <p style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>Chưa có dữ liệu điểm danh trong tháng này.</p>
            )}

            {histData && histData.dayData.length > 0 && (
              <>
                <h4 style={{ color: '#c0392b', marginBottom: 12 }}>📊 Tổng hợp tháng {histData.month}/{histData.year}</h4>
                <p style={{ color: '#666', marginBottom: 12 }}>Số buổi đã điểm danh: <strong>{histData.dayData.length}</strong></p>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                  <thead>
                    <tr>
                      {['#', 'Học sinh', '✅ Có mặt', '❌ Vắng', '📊 Tỉ lệ'].map((h, i) => (
                        <th key={h} style={{ ...thStyle, textAlign: i > 1 ? 'center' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(histData.studentMap).map(([id, s]: [string, any], i) => {
                      const total = s.present + s.absent;
                      const pct = total > 0 ? Math.round(s.present / total * 100) : 0;
                      const color = pct >= 80 ? '#155724' : pct >= 60 ? '#856404' : '#721c24';
                      const bg = pct >= 80 ? '#d4edda' : pct >= 60 ? '#fff3cd' : '#f8d7da';
                      return (
                        <tr key={id}>
                          <td style={tdStyle}>{i + 1}</td>
                          <td style={tdStyle}><strong>{s.name}</strong></td>
                          <td style={{ ...tdStyle, textAlign: 'center', color: '#155724', fontWeight: 'bold' }}>{s.present}</td>
                          <td style={{ ...tdStyle, textAlign: 'center', color: '#721c24', fontWeight: 'bold' }}>{s.absent}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 12, fontWeight: 'bold' }}>{pct}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <h4 style={{ color: '#c0392b', margin: '20px 0 12px' }}>📅 Chi tiết từng buổi</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Ngày', '✅ Có mặt', '❌ Vắng', 'Hành động'].map((h, i) => (
                        <th key={h} style={{ ...thStyle, textAlign: i > 0 && i < 3 ? 'center' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {histData.dayData.map((d: any) => (
                      <tr key={d.day}>
                        <td style={tdStyle}>{String(d.day).padStart(2, '0')}/{String(histData.month).padStart(2, '0')}/{histData.year}</td>
                        <td style={{ ...tdStyle, textAlign: 'center', color: '#155724', fontWeight: 'bold' }}>{d.presentCount}</td>
                        <td style={{ ...tdStyle, textAlign: 'center', color: '#721c24', fontWeight: 'bold' }}>{d.absentCount}</td>
                        <td style={tdStyle}>
                          <button
                            style={{ padding: '5px 12px', background: '#3498db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                            onClick={() => {
                              const dateStr = `${histData.year}-${String(histData.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
                              setAttDate(dateStr);
                              setAttLoaded(false);
                              setTab('attendance');
                            }}
                          >Xem & Sửa</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ── Tab: Edit ── */}
        {tab === 'edit' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontWeight: 600, color: '#555', marginTop: 14 }}>Tên lớp</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Tên lớp" style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6, fontSize: '1em' }} />

              <label style={{ fontWeight: 600, color: '#555', marginTop: 14 }}>Lịch học</label>
              <input type="text" value={editSchedule} onChange={e => setEditSchedule(e.target.value)} placeholder="Ví dụ: Thứ 2,4 - 7:30-9:00" style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6, fontSize: '1em' }} />

              <label style={{ fontWeight: 600, color: '#555', marginTop: 14 }}>Ngày bắt đầu</label>
              <input type="datetime-local" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6, fontSize: '1em' }} />

              <div style={{ marginTop: 16 }}>
                <button style={{ padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '1em' }} onClick={saveEdit}>
                  💾 Lưu thay đổi
                </button>
              </div>
              {editMsg && <Msg {...editMsg} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}