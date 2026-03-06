// src/features/student/components/RestoreModal.tsx
import { useState } from 'react';
import { useStudentApi } from '../hooks/useStudentApi';

interface Props {
  attendanceId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RestoreModal({ attendanceId, onClose, onSuccess }: Props) {
  const api = useStudentApi();
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' | 'warn' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setMsg({ text: '⚠️ Vui lòng nhập lý do.', type: 'warn' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/attendance/restore-request', { attendanceId, reason: trimmed });
      setMsg({ text: '✅ Gửi đơn thành công! Vui lòng chờ giáo viên xét duyệt.', type: 'success' });
      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1800);
    } catch (err: any) {
      setMsg({ text: '❌ ' + (err.response?.data?.message || 'Lỗi khi gửi đơn'), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const msgStyle = (): React.CSSProperties => {
    if (!msg) return {};
    const map = {
      success: { background: '#d4edda', color: '#155724' },
      error:   { background: '#f8d7da', color: '#721c24' },
      warn:    { background: '#fff3cd', color: '#856404' },
    };
    return { ...map[msg.type], display: 'block', marginTop: 10, padding: 10, borderRadius: 6, fontSize: '0.9em' };
  };

  return (
    <div
      onClick={e => { if ((e.target as HTMLElement) === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20,
      }}
    >
      <div style={{ background: 'white', borderRadius: 12, padding: 30, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>📝 Gửi đơn xin khôi phục điểm danh</h3>
        <p style={{ color: '#666', fontSize: '0.95em', marginBottom: 16 }}>
          Nhập lý do vắng mặt. Giáo viên sẽ xem xét và phê duyệt.
        </p>

        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          placeholder="Ví dụ: Em bị ốm và có giấy xác nhận của bác sĩ ngày ..."
          style={{
            width: '100%', padding: 12, border: '1px solid #ddd',
            borderRadius: 8, fontSize: '1em', resize: 'vertical',
            boxSizing: 'border-box', fontFamily: 'inherit',
          }}
        />

        {msg && <div style={msgStyle()}>{msg.text}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{ padding: '10px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >Hủy</button>
          {!done && (
            <button
              onClick={submit}
              disabled={submitting}
              style={{ padding: '10px 20px', background: submitting ? '#ccc' : '#27ae60', color: 'white', border: 'none', borderRadius: 6, cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >{submitting ? '⏳ Đang gửi...' : '📤 Gửi đơn'}</button>
          )}
        </div>
      </div>
    </div>
  );
}