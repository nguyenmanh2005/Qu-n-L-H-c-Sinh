// src/features/student/components/StudentInfoCard.tsx
interface User {
  fullName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
}

export default function StudentInfoCard({ user }: { user: User | null }) {
  const items = [
    { label: 'Họ và tên',       value: user?.fullName },
    { label: 'Username',        value: user?.username },
    { label: 'Email',           value: user?.email },
    { label: 'Số điện thoại',   value: user?.phoneNumber },
  ];

  return (
    <div style={{
      background: 'white', borderRadius: 10,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      padding: 25, marginBottom: 30,
    }}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Thông tin cá nhân</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {items.map(({ label, value }) => (
          <div key={label} style={{
            background: '#f8f9fa', padding: 15,
            borderRadius: 8, borderLeft: '5px solid #667eea',
          }}>
            <strong>{label}:</strong><br />
            <span>{value || (label === 'Username' ? '—' : 'Chưa cập nhật')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}