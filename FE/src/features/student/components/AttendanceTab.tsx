// src/features/student/components/AttendanceTab.tsx
import { useEffect, useState } from 'react';
import { useStudentApi } from '../hooks/useStudentApi';
import RestoreModal from './RestoreModal';

export default function AttendanceTab() {
  const api = useStudentApi();
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAttendance(); }, []);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance');
      setAllAttendance(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const toggleMonthlySummary = async () => {
    if (showSummary) { setShowSummary(false); return; }
    if (!filterMonth) { alert('Chọn tháng trước để xem tổng hợp'); return; }
    const [year, month] = filterMonth.split('-').map(Number);
    setSummaryLoading(true);
    setShowSummary(true);
    try {
      const res = await api.get(`/attendance/monthly-summary?year=${year}&month=${month}`);
      setSummaryData(res.data || []);
    } catch (err) { console.error(err); setSummaryData([]); }
    finally { setSummaryLoading(false); }
  };

  // Filter
  let filtered = allAttendance;
  if (filterClass)  filtered = filtered.filter(r => String(r.classId) === filterClass);
  if (filterMonth) {
    const [y, m] = filterMonth.split('-').map(Number);
    filtered = filtered.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }
  if (filterStatus === 'present') filtered = filtered.filter(r => r.present);
  if (filterStatus === 'absent')  filtered = filtered.filter(r => !r.present);
  if (filterStatus === 'pending') filtered = filtered.filter(r => !r.present && r.restoreRequested && r.restoreStatus !== 'Approved' && r.restoreStatus !== 'Rejected');

  // Sort by date desc
  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Summary stats
  const total   = filtered.length;
  const present = filtered.filter(r => r.present).length;
  const absent  = total - present;
  const pending = filtered.filter(r => !r.present && r.restoreRequested && r.restoreStatus !== 'Approved' && r.restoreStatus !== 'Rejected').length;
  const pct     = total > 0 ? Math.round(present / total * 100) : 0;
  const pctColor = pct >= 80 ? '#155724' : pct >= 60 ? '#856404' : '#721c24';
  const pctBg    = pct >= 80 ? '#d4edda'  : pct >= 60 ? '#fff3cd' : '#f8d7da';

  const classIds = [...new Set(allAttendance.map(r => r.classId).filter(Boolean))];

  const thStyle: React.CSSProperties = { background: '#f0f0ff', color: '#4a4a9a', fontWeight: 600, padding: '10px 12px', border: '1px solid #eee', textAlign: 'left', fontSize: '0.93em' };
  const tdStyle: React.CSSProperties = { padding: '10px 12px', border: '1px solid #eee', fontSize: '0.93em' };

  if (loading) return <p style={{ textAlign: 'center', padding: '40px 0', color: '#777' }}>Đang tải dữ liệu điểm danh...</p>;

  return (
    <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 25, marginBottom: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0 }}>📋 Lịch sử điểm danh</h2>
        <button
          style={{ padding: '6px 14px', fontSize: '0.88em', background: '#27ae60', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          onClick={loadAttendance}
        >🔄 Làm mới</button>
      </div>

      {/* Summary boxes */}
      {allAttendance.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ padding: '10px 18px', borderRadius: 8, fontWeight: 'bold', background: '#d4edda', color: '#155724' }}>✅ Có mặt: {present}</div>
          <div style={{ padding: '10px 18px', borderRadius: 8, fontWeight: 'bold', background: '#f8d7da', color: '#721c24' }}>❌ Vắng: {absent}</div>
          <div style={{ padding: '10px 18px', borderRadius: 8, fontWeight: 'bold', background: '#fff3cd', color: '#856404' }}>⏳ Đơn chờ: {pending}</div>
          <div style={{ padding: '10px 18px', borderRadius: 8, fontWeight: 'bold', background: pctBg, color: pctColor }}>📊 Tỉ lệ: {pct}%</div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.92em' }}
        >
          <option value="">Tất cả lớp</option>
          {classIds.map(id => <option key={id} value={id}>Lớp {id}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.92em' }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="present">✅ Có mặt</option>
          <option value="absent">❌ Vắng</option>
          <option value="pending">⏳ Đơn đang xử lý</option>
        </select>
        <input
          type="month"
          value={filterMonth}
          onChange={e => { setFilterMonth(e.target.value); setShowSummary(false); }}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.92em' }}
        />
        <button
          onClick={toggleMonthlySummary}
          style={{ padding: '8px 14px', background: '#e67e22', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.92em' }}
        >📊 Tổng hợp tháng</button>
      </div>

      {/* Monthly summary panel */}
      {showSummary && (
        <div style={{ marginBottom: 16 }}>
          {summaryLoading ? (
            <p style={{ color: '#777' }}>Đang tải tổng hợp...</p>
          ) : !summaryData.length ? (
            <p style={{ color: '#aaa' }}>Không có dữ liệu tháng này.</p>
          ) : (
            <div style={{ background: '#f8f9fa', borderRadius: 10, padding: 16, border: '1px solid #eee' }}>
              <h4 style={{ marginTop: 0, color: '#4a4a9a' }}>
                📊 Tổng hợp tháng {filterMonth?.split('-')[1]}/{filterMonth?.split('-')[0]}
              </h4>
              {summaryData.map(cls => {
                const pct   = cls.attendanceRate || 0;
                const color = pct >= 80 ? '#155724' : pct >= 60 ? '#856404' : '#721c24';
                const bg    = pct >= 80 ? '#d4edda'  : pct >= 60 ? '#fff3cd' : '#f8d7da';
                const bar   = Math.round(pct);
                return (
                  <div key={cls.classId} style={{ marginBottom: 16, padding: 14, background: 'white', borderRadius: 8, border: '1px solid #e0e0ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      <strong style={{ color: '#4a4a9a' }}>{cls.className}</strong>
                      <span style={{ background: bg, color, padding: '4px 12px', borderRadius: 12, fontWeight: 'bold', fontSize: '0.95em' }}>{pct}% chuyên cần</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.9em', color: '#555', marginBottom: 10, flexWrap: 'wrap' }}>
                      <span>📅 {cls.totalSessions} buổi</span>
                      <span style={{ color: '#155724' }}>✅ Có mặt: {cls.presentCount}</span>
                      <span style={{ color: '#721c24' }}>❌ Vắng: {cls.absentCount}</span>
                    </div>
                    <div style={{ background: '#e9ecef', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                      <div style={{ width: `${bar}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Attendance table */}
      {!allAttendance.length ? (
        <p style={{ textAlign: 'center', color: '#aaa', padding: '30px 0' }}>Chưa có bản ghi điểm danh nào.</p>
      ) : !sorted.length ? (
        <p style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>Không có bản ghi nào phù hợp.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <p style={{ color: '#666', marginBottom: 10, fontSize: '0.9em' }}>Hiển thị <strong>{sorted.length}</strong> bản ghi</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Lớp', 'Ngày điểm danh', 'Trạng thái', 'Đơn khôi phục', 'Hành động'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const canRequest = !r.present && !r.restoreRequested;
                const isPending  = !r.present && r.restoreRequested && r.restoreStatus !== 'Approved' && r.restoreStatus !== 'Rejected';
                return (
                  <tr
                    key={r.id}
                    style={{ background: canRequest ? '#fff8f8' : '' }}
                    onMouseEnter={e => { e.currentTarget.querySelectorAll('td').forEach(td => (td.style.background = '#fafafa')); }}
                    onMouseLeave={e => { e.currentTarget.querySelectorAll('td').forEach(td => (td.style.background = canRequest ? '#fff8f8' : '')); }}
                  >
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={tdStyle}>Lớp {r.classId || '—'}</td>
                    <td style={tdStyle}>
                      {r.date ? new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                    </td>
                    <td style={tdStyle}>
                      {r.present
                        ? <span style={{ background: '#d4edda', color: '#155724', padding: '3px 10px', borderRadius: 12, fontSize: '0.82em', fontWeight: 'bold' }}>✅ Có mặt</span>
                        : <span style={{ background: '#f8d7da', color: '#721c24', padding: '3px 10px', borderRadius: 12, fontSize: '0.82em', fontWeight: 'bold' }}>❌ Vắng mặt</span>
                      }
                    </td>
                    <td style={tdStyle}>
                      {r.restoreRequested
                        ? r.restoreStatus === 'Approved'
                          ? <span style={{ background: '#d4edda', color: '#155724', padding: '3px 10px', borderRadius: 12, fontSize: '0.82em', fontWeight: 'bold' }}>✅ Đã duyệt</span>
                          : r.restoreStatus === 'Rejected'
                          ? <span style={{ background: '#f8d7da', color: '#721c24', padding: '3px 10px', borderRadius: 12, fontSize: '0.82em', fontWeight: 'bold' }}>❌ Từ chối</span>
                          : <span style={{ background: '#fff3cd', color: '#856404', padding: '3px 10px', borderRadius: 12, fontSize: '0.82em', fontWeight: 'bold' }}>⏳ Đang xử lý</span>
                        : <span style={{ color: '#aaa' }}>—</span>
                      }
                    </td>
                    <td style={tdStyle}>
                      {canRequest ? (
                        <button
                          style={{ padding: '5px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.88em' }}
                          onClick={() => setSelectedAttendanceId(r.id)}
                        >📝 Gửi đơn</button>
                      ) : isPending ? (
                        <span style={{ fontSize: '0.85em', color: '#856404' }}>Đã gửi đơn</span>
                      ) : (
                        <span style={{ color: '#aaa' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedAttendanceId !== null && (
        <RestoreModal
          attendanceId={selectedAttendanceId}
          onClose={() => setSelectedAttendanceId(null)}
          onSuccess={loadAttendance}
        />
      )}
    </div>
  );
}