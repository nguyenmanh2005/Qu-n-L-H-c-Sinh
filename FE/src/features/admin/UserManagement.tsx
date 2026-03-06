// src/features/admin/UserManagement.tsx
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  userName: string;
  fullName?: string;
  email: string;
  emailConfirmed: boolean;
  phoneNumber?: string;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  role: string;
}

type Modal =
  | { type: 'none' }
  | { type: 'createUser' }
  | { type: 'editUser'; user: User }
  | { type: 'assignRole'; user: User };

interface EditUserState {
  userName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
}

// ─── API ──────────────────────────────────────────────────────────────────────
function useApi() {
  const token = useAuthStore((s) => s.token);
  return useMemo(() => axios.create({
    baseURL: 'http://localhost:5187/api',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  }), [token]);
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'ok' | 'err'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold
      ${type === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`}>
      <span className="text-base">{type === 'ok' ? '✓' : '✕'}</span>
      <span>{msg}</span>
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function ModalWrap({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Form components ──────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label}>
      <input {...props} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-slate-300" />
    </Field>
  );
}

function Select({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <Field label={label}>
      <select {...props} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-white">
        {children}
      </select>
    </Field>
  );
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
function Btn({ variant = 'primary', size = 'md', className = '', ...props }: {
  variant?: 'primary' | 'danger' | 'ghost' | 'purple' | 'emerald';
  size?: 'sm' | 'md';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200',
    danger:  'bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-100',
    ghost:   'bg-slate-100 hover:bg-slate-200 text-slate-600',
    purple:  'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200',
    emerald: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-100',
  }[variant];
  const s = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return <button {...props} className={`${v} ${s} rounded-lg font-semibold disabled:opacity-40 transition-all duration-150 ${className}`} />;
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    Admin:   'bg-rose-100 text-rose-700 border border-rose-200',
    Teacher: 'bg-violet-100 text-violet-700 border border-violet-200',
    Student: 'bg-sky-100 text-sky-700 border border-sky-200',
  };
  const icons: Record<string, string> = { Admin: '⚡', Teacher: '👨‍🏫', Student: '🎓' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${map[role] ?? 'bg-gray-100 text-gray-600'}`}>
      <span>{icons[role] ?? '👤'}</span>{role}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, role }: { name: string; role: string }) {
  const bg: Record<string, string> = {
    Admin:   'from-rose-400 to-pink-500',
    Teacher: 'from-violet-400 to-purple-500',
    Student: 'from-sky-400 to-blue-500',
  };
  return (
    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${bg[role] ?? 'from-slate-400 to-slate-500'} flex items-center justify-center text-white font-black text-sm shadow-sm flex-shrink-0`}>
      {(name ?? '?')[0].toUpperCase()}
    </div>
  );
}

// ─── Status dot ──────────────────────────────────────────────────────────────
function Dot({ on }: { on: boolean }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${on ? 'bg-emerald-400' : 'bg-slate-200'}`} />;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const api = useApi();
  const [modal, setModal] = useState<Modal>({ type: 'none' });
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const [newUser, setNewUser] = useState({ username: '', fullName: '', email: '', password: '', role: 'Student' });
  const [editUser, setEditUser] = useState<EditUserState>({ userName: '', fullName: '', email: '', phoneNumber: '', emailConfirmed: false, phoneNumberConfirmed: false });
  const [newRole, setNewRole] = useState('Student');

  const ok  = (msg: string) => setToast({ msg, type: 'ok' });
  const err = (msg: string) => setToast({ msg, type: 'err' });
  const closeModal = () => setModal({ type: 'none' });

  const filtered = useMemo(() => users.filter(u => {
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const q = search.toLowerCase();
    const matchSearch = !q || u.userName.toLowerCase().includes(q) || (u.fullName ?? '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  }), [users, search, filterRole]);

  const roleCounts = useMemo(() => ({
    all: users.length,
    Admin: users.filter(u => u.role === 'Admin').length,
    Teacher: users.filter(u => u.role === 'Teacher').length,
    Student: users.filter(u => u.role === 'Student').length,
  }), [users]);

  const loadUsers = async () => {
    setLoading(true);
    try { const res = await api.get('/admin/users'); setUsers(res.data); }
    catch { err('Lỗi tải danh sách người dùng'); }
    finally { setLoading(false); }
  };

  const createUser = async () => {
    if (!newUser.username || !newUser.password) return err('Username và password bắt buộc');
    setLoading(true);
    try {
      await api.post('/admin/create-user', newUser);
      ok('Tạo người dùng thành công!');
      closeModal();
      setNewUser({ username: '', fullName: '', email: '', password: '', role: 'Student' });
      loadUsers();
    } catch (e: any) { err(e.response?.data?.message || 'Lỗi tạo người dùng'); }
    finally { setLoading(false); }
  };

  const updateUser = async (id: string) => {
    setLoading(true);
    try { await api.put(`/admin/users/${id}`, editUser); ok('Cập nhật thành công!'); closeModal(); loadUsers(); }
    catch (e: any) { err(e.response?.data?.message || 'Lỗi cập nhật'); }
    finally { setLoading(false); }
  };

  const deleteUser = async (user: User) => {
    if (!confirm(`Xóa "${user.userName}"?`)) return;
    setLoading(true);
    try { await api.delete(`/admin/users/${user.id}`); ok('Đã xóa!'); loadUsers(); }
    catch (e: any) { err(e.response?.data?.message || 'Lỗi xóa'); }
    finally { setLoading(false); }
  };

  const assignRole = async (userId: string) => {
    setLoading(true);
    try { await api.post(`/admin/users/${userId}/assign-role`, { roleName: newRole }); ok(`Đã gán role ${newRole}!`); closeModal(); loadUsers(); }
    catch (e: any) { err(e.response?.data?.message || 'Lỗi gán role'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const TAB_ROLES = [
    { key: 'all',     label: 'Tất cả' },
    { key: 'Admin',   label: 'Admin' },
    { key: 'Teacher', label: 'Giáo viên' },
    { key: 'Student', label: 'Học sinh' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Quản lý Người Dùng</h1>
            <p className="text-sm text-slate-400 mt-0.5">{users.length} tài khoản trong hệ thống</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadUsers} disabled={loading}
              className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-medium transition flex items-center gap-1.5">
              <span className={loading ? 'animate-spin inline-block' : ''}>↻</span> Tải lại
            </button>
            <Btn onClick={() => setModal({ type: 'createUser' })}>+ Tạo người dùng</Btn>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Role tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-shrink-0">
            {TAB_ROLES.map(t => (
              <button key={t.key} onClick={() => setFilterRole(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterRole === t.key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                {t.label}
                <span className={`ml-1.5 text-xs ${filterRole === t.key ? 'text-indigo-500' : 'text-slate-400'}`}>
                  {roleCounts[t.key as keyof typeof roleCounts]}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-slate-300" />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-300 text-sm">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <div className="text-slate-400 text-sm">Không tìm thấy người dùng nào</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Người dùng', 'Email', 'Điện thoại', 'Xác nhận', '2FA', 'Role', 'Thao tác'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.userName} role={u.role} />
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{u.userName}</div>
                            {u.fullName && <div className="text-xs text-slate-400">{u.fullName}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">{u.email}</td>
                      <td className="px-5 py-4 text-sm text-slate-400">{u.phoneNumber || <span className="text-slate-200">—</span>}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Dot on={u.emailConfirmed} />
                            <span>Email</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Dot on={u.phoneNumberConfirmed} />
                            <span>Phone</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${u.twoFactorEnabled ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                          {u.twoFactorEnabled ? '🔒 On' : 'Off'}
                        </span>
                      </td>
                      <td className="px-5 py-4"><RoleBadge role={u.role} /></td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Btn size="sm" variant="ghost" onClick={() => {
                            setEditUser({ userName: u.userName, fullName: u.fullName || '', email: u.email, phoneNumber: u.phoneNumber || '', emailConfirmed: u.emailConfirmed, phoneNumberConfirmed: u.phoneNumberConfirmed });
                            setModal({ type: 'editUser', user: u });
                          }}>Sửa</Btn>
                          <Btn size="sm" variant="purple" onClick={() => { setNewRole(u.role); setModal({ type: 'assignRole', user: u }); }}>Role</Btn>
                          <Btn size="sm" variant="danger" onClick={() => deleteUser(u)}>Xóa</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-xs text-slate-400 mt-3 text-right">Hiển thị {filtered.length} / {users.length} người dùng</p>
        )}
      </div>

      {/* ── Modals ── */}

      {modal.type === 'createUser' && (
        <ModalWrap title="Tạo người dùng mới" onClose={closeModal}>
          <Input label="Username *" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} placeholder="vd: nguyen.van.a" />
          <Input label="Họ và tên" value={newUser.fullName || ''} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} placeholder="Nguyễn Văn A" />
          <Input label="Email" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="a@example.com" />
          <Input label="Mật khẩu *" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Tối thiểu 6 ký tự" />
          <Select label="Role" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
            <option>Student</option><option>Teacher</option><option>Admin</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Btn variant="ghost" onClick={closeModal}>Hủy</Btn>
            <Btn onClick={createUser} disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo người dùng'}</Btn>
          </div>
        </ModalWrap>
      )}

      {modal.type === 'editUser' && (
        <ModalWrap title={`Chỉnh sửa: ${modal.user.userName}`} onClose={closeModal}>
          <Input label="Username" value={editUser.userName} onChange={e => setEditUser({ ...editUser, userName: e.target.value })} />
          <Input label="Họ và tên" value={editUser.fullName} onChange={e => setEditUser({ ...editUser, fullName: e.target.value })} />
          <Input label="Email" type="email" value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
          <Input label="Số điện thoại" value={editUser.phoneNumber} onChange={e => setEditUser({ ...editUser, phoneNumber: e.target.value })} placeholder="0901234567" />
          <Select label="Email Confirmed" value={String(editUser.emailConfirmed)} onChange={e => setEditUser({ ...editUser, emailConfirmed: e.target.value === 'true' })}>
            <option value="true">✓ Đã xác nhận</option><option value="false">✗ Chưa xác nhận</option>
          </Select>
          <Select label="Phone Confirmed" value={String(editUser.phoneNumberConfirmed)} onChange={e => setEditUser({ ...editUser, phoneNumberConfirmed: e.target.value === 'true' })}>
            <option value="true">✓ Đã xác nhận</option><option value="false">✗ Chưa xác nhận</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Btn variant="ghost" onClick={closeModal}>Hủy</Btn>
            <Btn onClick={() => updateUser(modal.user.id)} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</Btn>
          </div>
        </ModalWrap>
      )}

      {modal.type === 'assignRole' && (
        <ModalWrap title={`Đổi role: ${modal.user.userName}`} onClose={closeModal}>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Avatar name={modal.user.userName} role={modal.user.role} />
            <div>
              <div className="text-sm font-semibold text-slate-700">{modal.user.userName}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">Hiện tại:</span>
                <RoleBadge role={modal.user.role} />
              </div>
            </div>
          </div>
          <Select label="Role mới" value={newRole} onChange={e => setNewRole(e.target.value)}>
            <option>Student</option><option>Teacher</option><option>Admin</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Btn variant="ghost" onClick={closeModal}>Hủy</Btn>
            <Btn variant="purple" onClick={() => assignRole(modal.user.id)} disabled={loading}>{loading ? 'Đang gán...' : 'Gán role'}</Btn>
          </div>
        </ModalWrap>
      )}
    </div>
  );
}