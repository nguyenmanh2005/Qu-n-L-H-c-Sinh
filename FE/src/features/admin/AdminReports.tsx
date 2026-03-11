// src/features/admin/AdminReports.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

// ── API ────────────────────────────────────────────────────────────────────────

function useApi() {
  const token = useAuthStore((s) => s.token);
  return axios.create({
    baseURL: 'http://localhost:5187/api',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  userName: string;
  email: string;
  role: string;
}

interface ClassItem {
  id: number;
  name: string;
  code: string;
  teacherName?: string;
  studentCount?: number;
  schedule?: string;
}

interface ClassStudent {
  studentId: string;
  studentName: string;
  status: string;
}

interface ClassDetail extends ClassItem {
  approved: number;
  pending: number;
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, sub }: {
  label: string; value: number | string; icon: string;
  color: { from: string; to: string; light: string; text: string };
  sub?: string;
}) {
  return (
    <div style={{
      background: 'white', borderRadius: 16,
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ height: 4, background: `linear-gradient(90deg, ${color.from}, ${color.to})` }} />
      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.78em', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: '2.4em', fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: '0.78em', color: '#94a3b8', marginTop: 6 }}>{sub}</div>}
          </div>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: color.light, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '1.4em',
          }}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '24px 26px', marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '1em', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.01em' }}>{title}</h3>
      {children}
    </div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '0.85em' }}>
      {label && <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  Admin:   '#6366f1',
  Teacher: '#10b981',
  Student: '#f59e0b',
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AdminReports() {
  const api = useApi();

  const [users, setUsers]           = useState<User[]>([]);
  const [classes, setClasses]       = useState<ClassItem[]>([]);
  const [classDetails, setDetails]  = useState<ClassDetail[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Fetch users + classes ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [uRes, cRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/classes'),
        ]);
        setUsers(uRes.data || []);
        setClasses(cRes.data || []);
      } catch (e: any) {
        setError('Không thể tải dữ liệu. Kiểm tra kết nối API.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Fetch student status for each class ─────────────────────────────────────
  useEffect(() => {
    if (!classes.length) return;
    const fetchDetails = async () => {
      setDetailLoading(true);
      const details: ClassDetail[] = await Promise.all(
        classes.map(async (cls) => {
          try {
            const res = await api.get(`/admin/classes/${cls.id}/students`);
            const students: ClassStudent[] = res.data?.students || res.data || [];
            return {
              ...cls,
              approved: students.filter(s => s.status === 'Approved').length,
              pending:  students.filter(s => s.status === 'Pending').length,
            };
          } catch {
            return { ...cls, approved: cls.studentCount ?? 0, pending: 0 };
          }
        })
      );
      setDetails(details);
      setDetailLoading(false);
    };
    fetchDetails();
  }, [classes]);

  // ── Derived stats ────────────────────────────────────────────────────────────

  const totalUsers    = users.length;
  const totalClasses  = classes.length;
  const totalTeachers = users.filter(u => u.role === 'Teacher').length;
  const totalStudents = users.filter(u => u.role === 'Student').length;
  const totalAdmins   = users.filter(u => u.role === 'Admin').length;

  // Role distribution for pie chart
  const roleData = [
    { name: 'Admin',   value: totalAdmins   },
    { name: 'Teacher', value: totalTeachers },
    { name: 'Student', value: totalStudents },
  ].filter(r => r.value > 0);

  // Top 8 classes by student count
  const topClasses = [...classDetails]
    .sort((a, b) => (b.approved + b.pending) - (a.approved + a.pending))
    .slice(0, 8)
    .map(c => ({
      name:     c.name.length > 14 ? c.name.substring(0, 14) + '…' : c.name,
      fullName: c.name,
      Duyệt:    c.approved,
      'Chờ':    c.pending,
    }));

  // Classes without teacher
  const noTeacher = classes.filter(c => !c.teacherName).length;

  // Classes without schedule
  const noSchedule = classes.filter(c => !c.schedule).length;

  // Enrollment overview
  const totalApproved = classDetails.reduce((s, c) => s + c.approved, 0);
  const totalPending  = classDetails.reduce((s, c) => s + c.pending, 0);

  const enrollData = [
    { name: 'Đã duyệt', value: totalApproved },
    { name: 'Chờ duyệt', value: totalPending  },
  ].filter(d => d.value > 0);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#94a3b8' }}>
      <div style={{ fontSize: '2.5em' }}>📊</div>
      <div style={{ fontWeight: 600 }}>Đang tải dữ liệu...</div>
    </div>
  );

  if (error) return (
    <div style={{ margin: 32, padding: '20px 24px', background: '#fee2e2', borderRadius: 12, color: '#991b1b', fontWeight: 600, border: '1px solid #fca5a5' }}>
      ⚠️ {error}
    </div>
  );

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2em', boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}>📊</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5em', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Báo cáo hệ thống</h1>
              <p style={{ margin: 0, fontSize: '0.82em', color: '#94a3b8' }}>Cập nhật realtime từ dữ liệu thực</p>
            </div>
          </div>
          <div style={{ height: 1, background: 'linear-gradient(90deg, #e2e8f0, transparent)', marginTop: 16 }} />
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard label="Tổng người dùng" value={totalUsers}    icon="👤" color={{ from: '#6366f1', to: '#8b5cf6', light: '#ede9fe', text: '#4c1d95' }} sub={`${totalAdmins} admin`} />
          <StatCard label="Lớp học"          value={totalClasses}  icon="🏫" color={{ from: '#10b981', to: '#059669', light: '#dcfce7', text: '#14532d' }} sub={`${noTeacher} chưa có GV`} />
          <StatCard label="Giáo viên"         value={totalTeachers} icon="👨‍🏫" color={{ from: '#0ea5e9', to: '#0284c7', light: '#e0f2fe', text: '#075985' }} sub={`/ ${totalClasses} lớp`} />
          <StatCard label="Học sinh"          value={totalStudents} icon="🎓" color={{ from: '#f59e0b', to: '#d97706', light: '#fef9c3', text: '#713f12' }} sub={`${totalPending} chờ duyệt`} />
        </div>

        {/* ── Row: Pie charts ─────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* Role distribution */}
          <Section title="📌 Phân bố vai trò người dùng">
            {roleData.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Không có dữ liệu</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart>
                    <Pie data={roleData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">
                      {roleData.map((entry) => (
                        <Cell key={entry.name} fill={ROLE_COLORS[entry.name] ?? '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {roleData.map(r => (
                    <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: ROLE_COLORS[r.name] ?? '#94a3b8', flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: '0.85em', color: '#475569', fontWeight: 600 }}>{r.name}</div>
                      <div style={{ fontSize: '0.9em', fontWeight: 800, color: '#1e293b' }}>{r.value}</div>
                      <div style={{ fontSize: '0.75em', color: '#94a3b8' }}>
                        ({totalUsers > 0 ? Math.round(r.value / totalUsers * 100) : 0}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Enrollment status */}
          <Section title="📋 Trạng thái ghi danh">
            {detailLoading ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Đang tải...</p>
            ) : enrollData.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Chưa có ghi danh nào</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart>
                    <Pie data={enrollData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Đã duyệt', value: totalApproved, color: '#10b981' },
                    { label: 'Chờ duyệt', value: totalPending,  color: '#f59e0b' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: '0.85em', color: '#475569', fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: '0.9em', fontWeight: 800, color: '#1e293b' }}>{item.value}</div>
                      <div style={{ fontSize: '0.75em', color: '#94a3b8' }}>
                        ({(totalApproved + totalPending) > 0 ? Math.round(item.value / (totalApproved + totalPending) * 100) : 0}%)
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: '0.8em', color: '#64748b' }}>
                    Tổng ghi danh: <strong>{totalApproved + totalPending}</strong>
                  </div>
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* ── Bar chart: top classes ───────────────────────────────────────────── */}
        <Section title="🏆 Top lớp theo số học sinh">
          {detailLoading ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Đang tải...</p>
          ) : topClasses.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Chưa có dữ liệu lớp học</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topClasses} margin={{ top: 4, right: 16, left: -10, bottom: 4 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend wrapperStyle={{ fontSize: '0.82em', paddingTop: 12 }} />
                <Bar dataKey="Duyệt" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Chờ"   fill="#fbbf24" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* ── Table: class overview ────────────────────────────────────────────── */}
        <Section title="📚 Tổng quan tất cả lớp học">
          {detailLoading ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Đang tải...</p>
          ) : classDetails.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Chưa có lớp học nào</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88em' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['#', 'Lớp', 'Mã', 'Giáo viên', 'Lịch học', '✅ Duyệt', '⏳ Chờ', 'Tỉ lệ'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classDetails.map((cls, i) => {
                    const total = cls.approved + cls.pending;
                    const pct   = total > 0 ? Math.round(cls.approved / total * 100) : 0;
                    const pctColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
                    const pctBg    = pct >= 80 ? '#dcfce7' : pct >= 50 ? '#fef9c3' : '#fee2e2';
                    return (
                      <tr key={cls.id} style={{ borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        <td style={{ padding: '11px 12px', color: '#94a3b8', fontWeight: 600 }}>{i + 1}</td>
                        <td style={{ padding: '11px 12px', fontWeight: 700, color: '#1e293b' }}>{cls.name}</td>
                        <td style={{ padding: '11px 12px' }}>
                          <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, fontSize: '0.88em', color: '#475569', fontWeight: 600 }}>{cls.code}</code>
                        </td>
                        <td style={{ padding: '11px 12px', color: cls.teacherName ? '#374151' : '#cbd5e1', fontStyle: cls.teacherName ? 'normal' : 'italic', fontSize: '0.9em' }}>
                          {cls.teacherName ? `👨‍🏫 ${cls.teacherName}` : 'Chưa gán'}
                        </td>
                        <td style={{ padding: '11px 12px', color: cls.schedule ? '#374151' : '#cbd5e1', fontStyle: cls.schedule ? 'normal' : 'italic', fontSize: '0.85em' }}>
                          {cls.schedule || 'Chưa cập nhật'}
                        </td>
                        <td style={{ padding: '11px 12px', fontWeight: 700, color: '#10b981' }}>{cls.approved}</td>
                        <td style={{ padding: '11px 12px', fontWeight: 700, color: '#f59e0b' }}>{cls.pending}</td>
                        <td style={{ padding: '11px 12px' }}>
                          {total > 0 ? (
                            <span style={{ background: pctBg, color: pctColor, padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.85em' }}>
                              {pct}%
                            </span>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontSize: '0.85em' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── Warning cards ────────────────────────────────────────────────────── */}
        {(noTeacher > 0 || noSchedule > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
            {noTeacher > 0 && (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.6em', flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#9a3412', marginBottom: 4 }}>{noTeacher} lớp chưa có giáo viên</div>
                  <div style={{ fontSize: '0.82em', color: '#c2410c' }}>Cần phân công giáo viên để lớp hoạt động bình thường.</div>
                </div>
              </div>
            )}
            {noSchedule > 0 && (
              <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.6em', flexShrink: 0 }}>📅</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#713f12', marginBottom: 4 }}>{noSchedule} lớp chưa có lịch học</div>
                  <div style={{ fontSize: '0.82em', color: '#92400e' }}>Học sinh chưa thể xem thời khóa biểu cho những lớp này.</div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}