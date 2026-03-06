// src/features/student/components/ClassesTab.tsx
import { useEffect, useState } from 'react';
import { useStudentApi } from '../hooks/useStudentApi';

interface Member {
  userId: string;
  fullName: string;
  email?: string;
  status: string;
}

interface TeacherInfo {
  userId: string;
  fullName: string;
  email?: string;
}

interface ClassMembers {
  classId: number;
  className: string;
  classCode: string;
  schedule?: string;
  teacher?: TeacherInfo;
  members: Member[];
}

interface Props {
  allClasses: any[];
  onReload: () => void;
}

export default function ClassesTab({ allClasses, onReload }: Props) {
  const api = useStudentApi();
  const [classCode, setClassCode] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal
  const [modalData, setModalData] = useState<ClassMembers | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const openMembersModal = async (classId: number, status: string) => {
    if (status !== 'Approved') return;
    setModalOpen(true);
    setModalData(null);
    setModalLoading(true);
    try {
      const res = await api.get(`/classes/${classId}/members`);
      setModalData(res.data);
    } catch {
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalData(null);
  };

  const joinClass = async () => {
    const trimmedCode = classCode.trim().toUpperCase();
    if (!trimmedCode) {
      setMessage({ text: 'Vui lòng nhập mã lớp!', type: 'error' });
      return;
    }
    try {
      await api.post('/join-request', { classCode: trimmedCode });
      setMessage({ text: 'Gửi yêu cầu thành công! Chờ giáo viên duyệt.', type: 'success' });
      setClassCode('');
      onReload();
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu',
        type: 'error',
      });
    }
  };

  const btn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: '6px 14px', fontSize: '0.88em',
    border: 'none', borderRadius: 6, cursor: 'pointer',
    color: 'white', transition: 'background 0.3s', ...extra,
  });

  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #e0e7ff',
    borderRadius: 10, padding: 20, transition: 'all 0.2s',
  };

  const statusBadge = (status: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      Approved: { background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' },
      Pending:  { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' },
      Rejected: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
    };
    return {
      display: 'inline-block', padding: '2px 10px',
      borderRadius: 20, fontSize: '0.8em', fontWeight: 600,
      ...(map[status] ?? { background: '#f3f4f6', color: '#374151' }),
    };
  };

  return (
    <>
      {/* ── Lớp học đang tham gia ── */}
      <div style={{
        background: 'white', borderRadius: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        padding: 25, marginBottom: 30,
      }}>
        <h2 style={{ marginTop: 0 }}>Lớp học đang tham gia</h2>

        {allClasses.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#777' }}>Bạn chưa tham gia lớp học nào.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {allClasses.map((cls) => (
              <div
                key={cls.classId ?? cls.id}
                style={card}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div style={{ fontSize: '1.15em', fontWeight: 'bold', marginBottom: 8, color: '#4338ca' }}>
                  {cls.name}
                </div>
                <p style={{ color: '#888', fontSize: '0.9em', margin: '4px 0' }}>
                  Mã: <strong>{cls.code}</strong>
                </p>
                <p style={{ color: '#888', fontSize: '0.9em', margin: '4px 0' }}>
                  👨‍🏫 {cls.teacher || cls.teacherName || 'Chưa có giáo viên'}
                </p>
                <p style={{ color: '#888', fontSize: '0.9em', margin: '4px 0' }}>
                  🕐 {cls.schedule || 'Chưa cập nhật'}
                </p>
                <p style={{ color: '#888', fontSize: '0.9em', margin: '8px 0 4px' }}>
                  Trạng thái:{' '}
                  <span style={statusBadge(cls.status)}>
                    {cls.status === 'Approved' ? 'Đã duyệt'
                      : cls.status === 'Pending' ? 'Chờ duyệt'
                      : 'Từ chối'}
                  </span>
                </p>

                {cls.status === 'Approved' && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      style={btn({ background: '#4f46e5' })}
                      onMouseEnter={e => (e.currentTarget.style.background = '#4338ca')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#4f46e5')}
                      onClick={() => openMembersModal(cls.classId ?? cls.id, cls.status)}
                    >
                      👥 Xem thành viên
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Xin tham gia lớp mới ── */}
      <div style={{
        background: 'white', borderRadius: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        padding: 25, marginBottom: 30,
      }}>
        <h2 style={{ marginTop: 0 }}>Xin tham gia lớp học mới</h2>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          Nhập mã lớp mà giáo viên cung cấp để gửi yêu cầu tham gia.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', maxWidth: 520 }}>
          <input
            type="text"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value.toUpperCase())}
            placeholder="Mã lớp (VD: WEB2025, SE07102)"
            style={{
              flex: 1, padding: '10px 16px',
              border: '1px solid #d1d5db', borderRadius: 8,
              fontSize: '0.95em', outline: 'none', minWidth: 200,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')}
            onBlur={e => (e.currentTarget.style.borderColor = '#d1d5db')}
          />
          <button
            onClick={joinClass}
            style={btn({ background: '#4f46e5', padding: '10px 24px', fontSize: '0.95em', borderRadius: 8 })}
            onMouseEnter={e => (e.currentTarget.style.background = '#4338ca')}
            onMouseLeave={e => (e.currentTarget.style.background = '#4f46e5')}
          >
            📨 Gửi yêu cầu
          </button>
        </div>

        {message && (
          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 8,
            fontSize: '0.9em', fontWeight: 500,
            ...(message.type === 'success'
              ? { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }
              : { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }),
          }}>
            {message.text}
          </div>
        )}
      </div>

      {/* ── MODAL THÀNH VIÊN ── */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: '#fff', borderRadius: 12,
              width: '100%', maxWidth: 560,
              maxHeight: '85vh', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#f5f3ff',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1em', color: '#3730a3' }}>
                  {modalData?.className ?? '...'}
                </div>
                <div style={{ fontSize: '0.85em', color: '#6b7280' }}>
                  Mã: {modalData?.classCode} · {modalData?.schedule || 'Chưa có lịch'}
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', fontSize: '1.4em', cursor: 'pointer', color: '#6b7280' }}
              >×</button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', padding: 24, flex: 1 }}>
              {modalLoading ? (
                <p style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>Đang tải...</p>
              ) : modalData ? (
                <>
                  {/* Giáo viên */}
                  <div style={{
                    background: '#eff6ff', border: '1px solid #bfdbfe',
                    borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                  }}>
                    <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: 6 }}>👨‍🏫 Giáo viên</div>
                    {modalData.teacher ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 500 }}>{modalData.teacher.fullName}</span>
                        <span style={{ fontSize: '0.85em', color: '#6b7280' }}>{modalData.teacher.email}</span>
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Chưa có giáo viên</span>
                    )}
                  </div>

                  {/* Danh sách học sinh */}
                  <div style={{ fontWeight: 600, marginBottom: 10, color: '#374151' }}>
                    👥 Thành viên ({modalData.members.length} học sinh)
                  </div>

                  {modalData.members.length === 0 ? (
                    <p style={{ color: '#9ca3af', textAlign: 'center' }}>Chưa có học sinh nào.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          {['#', 'Họ tên', 'Email'].map(h => (
                            <th key={h} style={{
                              padding: '8px 12px', textAlign: 'left',
                              border: '1px solid #e5e7eb',
                              color: '#6b7280', fontWeight: 600, fontSize: '0.85em',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.members.map((m, i) => (
                          <tr
                            key={m.userId}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f5f3ff')}
                            onMouseLeave={e => (e.currentTarget.style.background = '')}
                          >
                            <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', color: '#9ca3af' }}>{i + 1}</td>
                            <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', fontWeight: 500 }}>{m.fullName}</td>
                            <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', color: '#6b7280' }}>{m.email || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              ) : (
                <p style={{ textAlign: 'center', color: '#ef4444' }}>Không thể tải dữ liệu.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}