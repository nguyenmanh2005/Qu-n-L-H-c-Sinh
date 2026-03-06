// src/features/teacher/components/TeacherInfoCard.tsx
interface Teacher {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  classCount?: number;
}

export default function TeacherInfoCard({ teacher }: { teacher: Teacher | null }) {
  const items = [
    { label: 'Họ và tên', value: teacher?.fullName },
    { label: 'Email', value: teacher?.email },
    { label: 'Số điện thoại', value: teacher?.phoneNumber },
    { label: 'Số lớp đang dạy', value: teacher?.classCount ?? 0 },
  ];

  return (
    <div style={{
      background: 'white', borderRadius: 10,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      padding: 25, marginBottom: 30,
    }}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Thông tin giáo viên</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {items.map(({ label, value }) => (
          <div key={label} style={{
            background: '#fff5f5', padding: 15,
            borderRadius: 8, borderLeft: '5px solid #ff6b6b',
          }}>
            <strong>{label}:</strong><br />
            <span>{value || 'Đang tải...'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}