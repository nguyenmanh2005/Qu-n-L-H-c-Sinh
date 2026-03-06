// src/features/teacher/components/RestoreRequestsTab.tsx
import { useEffect, useState } from 'react';
import { useTeacherApi } from '../hooks/useTeacherApi';

export default function RestoreRequestsTab() {
  const api = useTeacherApi();
  const [requests, setRequests] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/restore-requests');
      setRequests(res.data || []);
      setSelected(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(requests.map(r => r.id)) : new Set());
  };

  const toggleOne = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const approveOne = async (id: number) => {
    if (!confirm('Duyệt yêu cầu này?')) return;
    try {
      await api.post(`/attendance/requests/${id}/approve`, {});
      await loadRequests();
    } catch (e: any) { alert(e.message); }
  };

  const rejectOne = async (id: number) => {
    if (!confirm('Từ chối yêu cầu này?')) return;
    try {
      await api.post(`/attendance/requests/${id}/reject`, {});
      await loadRequests();
    } catch (e: any) { alert(e.message); }
  };

  const bulkApprove = async () => {
    const ids = [...selected];
    if (!ids.length) { alert('Chọn ít nhất một đơn'); return; }
    if (!confirm(`Duyệt ${ids.length} đơn đã chọn?`)) return;
    try {
      await api.post('/attendance/requests/approve-bulk', { requestIds: ids });
      await loadRequests();
    } catch (e: any) { alert(e.message); }
  };

  const thStyle: React.CSSProperties = { background: '#fff5f5', color: '#c0392b', fontWeight: 600, padding: '10px 12px', border: '1px solid #eee', textAlign: 'left', fontSize: '0.93em' };
  const tdStyle: React.CSSProperties = { padding: '10px 12px', border: '1px solid #eee', fontSize: '0.93em' };

  return (
    <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 25, marginBottom: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0 }}>📬 Đơn xin khôi phục điểm danh</h2>
        <button
          style={{ padding: '6px 14px', fontSize: '0.88em', background: '#27ae60', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          onClick={loadRequests}
        >🔄 Làm mới</button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#777', padding: '30px 0' }}>Đang tải...</p>
      ) : !requests.length ? (
        <div style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>
          <div style={{ fontSize: '2em' }}>📭</div>
          <p>Không có đơn khôi phục nào đang chờ.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: '#fff3cd', color: '#856404', padding: '6px 14px', borderRadius: 8, fontWeight: 'bold' }}>
              ⏳ {requests.length} đơn chờ duyệt
            </span>
            <button
              style={{ padding: '6px 14px', fontSize: '0.88em', background: '#27ae60', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              onClick={bulkApprove}
            >✔ Duyệt tất cả đã chọn</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 30 }}>
                    <input
                      type="checkbox"
                      checked={selected.size === requests.length}
                      onChange={e => toggleAll(e.target.checked)}
                    />
                  </th>
                  {['#', 'Học sinh', 'Lớp', 'Ngày vắng', 'Lý do', 'Ngày gửi', 'Hành động'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => (
                  <tr key={r.id}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td style={tdStyle}>
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} />
                    </td>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={tdStyle}>
                      <strong>{r.studentName}</strong><br />
                      <span style={{ color: '#888', fontSize: '0.82em' }}>{r.studentEmail || ''}</span>
                    </td>
                    <td style={tdStyle}>Lớp {r.classId || '—'}</td>
                    <td style={tdStyle}>{r.date ? new Date(r.date).toLocaleDateString('vi-VN') : '—'}</td>
                    <td style={{ ...tdStyle, maxWidth: 180, fontSize: '0.9em' }}>{r.restoreReason || '—'}</td>
                    <td style={{ ...tdStyle, fontSize: '0.85em' }}>{r.requestDate ? new Date(r.requestDate).toLocaleDateString('vi-VN') : '—'}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <button
                        style={{ padding: '5px 10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 4 }}
                        onClick={() => approveOne(r.id)}
                      >✔ Duyệt</button>
                      <button
                        style={{ padding: '5px 10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                        onClick={() => rejectOne(r.id)}
                      >✘ Từ chối</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}