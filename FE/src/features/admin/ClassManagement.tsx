// src/features/admin/ClassManagement.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

interface Class {
  id: number; name: string; code: string;
  schedule?: string; teacherName?: string; teacherId?: string; studentCount?: number;
}
interface Student {
  enrollmentId: number; studentId: string; studentName: string; email?: string; status?: string;
}
interface Teacher { id: string; userName: string; email: string; }
interface SlotDef { slotNumber: number; label: string; timeStart: string; timeEnd: string; }

type Modal =
  | { type: 'none' } | { type: 'createClass' }
  | { type: 'assignTeacher'; cls: Class } | { type: 'updateSchedule'; cls: Class }
  | { type: 'classDetail'; cls: Class };

const DAY_OPTIONS = [
  { value: 'Thứ 2', label: 'T2' }, { value: 'Thứ 3', label: 'T3' },
  { value: 'Thứ 4', label: 'T4' }, { value: 'Thứ 5', label: 'T5' },
  { value: 'Thứ 6', label: 'T6' }, { value: 'Thứ 7', label: 'T7' },
  { value: 'Chủ nhật', label: 'CN' },
];

function useApi() {
  const token = useAuthStore((s) => s.token);
  return axios.create({ baseURL: 'http://localhost:5187/api', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
}

function Toast({ msg, type, onClose }: { msg: string; type: 'ok' | 'err'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold ${type === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`}>
      <span>{type === 'ok' ? '✓' : '✕'}</span><span>{msg}</span>
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

function ModalWrap({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <input {...props} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-slate-300" />
    </div>
  );
}

function Btn({ variant = 'primary', size = 'md', className = '', ...props }: {
  variant?: 'primary' | 'danger' | 'ghost' | 'purple' | 'emerald'; size?: 'sm' | 'md';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200',
    danger:  'bg-red-500 hover:bg-red-600 text-white',
    ghost:   'bg-slate-100 hover:bg-slate-200 text-slate-600',
    purple:  'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200',
    emerald: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-100',
  }[variant];
  const s = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return <button {...props} className={`${v} ${s} rounded-lg font-semibold disabled:opacity-40 transition-all ${className}`} />;
}

function ClassAvatar({ name }: { name: string }) {
  const GRADIENTS = ['from-emerald-400 to-teal-500','from-violet-400 to-purple-500','from-sky-400 to-blue-500','from-amber-400 to-orange-500','from-rose-400 to-pink-500'];
  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS[(name ?? '?').charCodeAt(0) % GRADIENTS.length]} flex items-center justify-center text-white font-black text-base shadow-sm flex-shrink-0`}>
      {(name ?? '?')[0].toUpperCase()}
    </div>
  );
}

function SchedulePicker({ selectedDays, onDaysChange, selectedSlot, onSlotChange, room, onRoomChange, slots }: {
  selectedDays: string[]; onDaysChange: (d: string[]) => void;
  selectedSlot: number | ''; onSlotChange: (s: number | '') => void;
  room: string; onRoomChange: (r: string) => void; slots: SlotDef[];
}) {
  const toggleDay = (day: string) =>
    onDaysChange(selectedDays.includes(day) ? selectedDays.filter(d => d !== day) : [...selectedDays, day]);

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ngày học</label>
        <div className="flex gap-2 flex-wrap">
          {DAY_OPTIONS.map(d => (
            <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
              className={`w-10 h-10 rounded-xl text-xs font-bold border-2 transition-all ${selectedDays.includes(d.value) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Slot học</label>
        {slots.length === 0 ? <div className="text-xs text-slate-300 italic">Đang tải slot...</div> : (
          <div className="grid grid-cols-2 gap-2">
            {slots.map(s => (
              <button key={s.slotNumber} type="button" onClick={() => onSlotChange(selectedSlot === s.slotNumber ? '' : s.slotNumber)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 transition-all text-left ${selectedSlot === s.slotNumber ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                <span className={`font-bold text-sm ${selectedSlot === s.slotNumber ? 'text-white' : 'text-indigo-600'}`}>Slot {s.slotNumber}</span>
                <span className={`text-xs ${selectedSlot === s.slotNumber ? 'text-indigo-200' : 'text-slate-400'}`}>{s.timeStart}–{s.timeEnd}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <Input label="Phòng học (tuỳ chọn)" value={room} onChange={e => onRoomChange(e.target.value)} placeholder="vd: P.A101" />
      {(selectedDays.length > 0 || selectedSlot !== '') && (
        <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
          <span className="text-indigo-400">📅</span>
          <span className="text-xs text-indigo-700 font-medium">
            {selectedDays.join(', ')}{selectedSlot !== '' ? ` · Slot ${selectedSlot}` : ''}{room ? ` · ${room}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}

function buildScheduleString(days: string[], slot: number | '', room: string) {
  return [days.join(', '), slot !== '' ? `Slot ${slot}` : '', room.trim()].filter(Boolean).join(' – ');
}

export default function ClassManagement() {
  const api = useApi();
  const [modal, setModal] = useState<Modal>({ type: 'none' });
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [slots, setSlots] = useState<SlotDef[]>([]);
  const [newClass, setNewClass] = useState({ name: '', code: '', teacherId: '' });
  const [schedDays, setSchedDays] = useState<string[]>([]);
  const [schedSlot, setSchedSlot] = useState<number | ''>('');
  const [schedRoom, setSchedRoom] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const ok  = (msg: string) => setToast({ msg, type: 'ok' });
  const err = (msg: string) => setToast({ msg, type: 'err' });
  const closeModal = () => setModal({ type: 'none' });
  const resetSched = () => { setSchedDays([]); setSchedSlot(''); setSchedRoom(''); };

  const filtered = classes.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.teacherName ?? '').toLowerCase().includes(q);
  });

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/classes');
      const classList: Class[] = res.data || [];
      setClasses(classList);
      // Load studentCount song song cho tất cả lớp
      const counts = await Promise.allSettled(
        classList.map(c => api.get(`/admin/classes/${c.id}/students`))
      );
      setClasses(classList.map((c, i) => {
        const r = counts[i];
        if (r.status === 'fulfilled') {
          const raw = r.value.data;
          const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.students) ? raw.students : [];
          return { ...c, studentCount: list.length };
        }
        return c;
      }));
    }
    catch { err('Lỗi tải danh sách lớp'); } finally { setLoading(false); }
  };
  const loadSlots = async () => {
    try { const res = await api.get('/admin/slots'); setSlots(res.data); } catch { err('Lỗi tải slot'); }
  };
  const loadTeachers = async () => {
    try { const res = await api.get('/admin/users'); setTeachers(res.data.filter((u: any) => u.role === 'Teacher')); }
    catch { err('Lỗi tải giáo viên'); setTeachers([]); }
  };
  const createClass = async () => {
    if (!newClass.name || !newClass.code) return err('Tên lớp và mã lớp bắt buộc');
    setLoading(true);
    try {
      await api.post('/admin/classes', { ...newClass, schedule: buildScheduleString(schedDays, schedSlot, schedRoom), slotNumber: schedSlot !== '' ? schedSlot : undefined });
      ok('Tạo lớp thành công!'); closeModal(); setNewClass({ name: '', code: '', teacherId: '' }); resetSched(); loadClasses();
    } catch (e: any) { err(e.response?.data?.message || 'Lỗi tạo lớp'); } finally { setLoading(false); }
  };
  const deleteClass = async (cls: Class) => {
    if (!confirm(`Xóa lớp "${cls.name}"?`)) return;
    setLoading(true);
    try { await api.delete(`/admin/classes/${cls.id}`); ok('Đã xóa!'); loadClasses(); }
    catch (e: any) { err(e.response?.data?.message || 'Lỗi'); } finally { setLoading(false); }
  };
  const loadClassStudents = async (cls: Class) => {
    setClassStudents([]); setModal({ type: 'classDetail', cls });
    try {
      const res = await api.get(`/admin/classes/${cls.id}/students`);
      // API có thể trả về array thẳng, hoặc { data: [...] }, hoặc { students: [...] }
      const raw = res.data;
      const list = Array.isArray(raw) ? raw
        : Array.isArray(raw?.data) ? raw.data
        : Array.isArray(raw?.students) ? raw.students
        : Array.isArray(raw?.items) ? raw.items
        : [];
      setClassStudents(list);
      // Cập nhật studentCount đúng trong bảng
      setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, studentCount: list.length } : c));
    }
    catch { err('Lỗi tải học sinh'); }
  };
  const removeStudent = async (enrollmentId: number, name: string) => {
    if (!confirm(`Xóa "${name}"?`)) return;
    try {
      await api.delete(`/admin/enrollments/${enrollmentId}`); ok(`Đã xóa "${name}"`);
      if (modal.type === 'classDetail') loadClassStudents(modal.cls);
    } catch (e: any) { err(e.response?.data?.message || 'Lỗi'); }
  };
  const assignTeacher = async () => {
    if (!selectedTeacherId) return err('Chọn giáo viên');
    if (modal.type !== 'assignTeacher') return;
    setLoading(true);
    try {
      await api.put(`/admin/classes/${modal.cls.id}/assign-teacher`, { TeacherId: selectedTeacherId });
      ok('Gán thành công!'); closeModal(); setSelectedTeacherId(''); loadClasses();
    } catch (e: any) { err(e.response?.data?.message || 'Lỗi'); } finally { setLoading(false); }
  };
  const updateSchedule = async () => {
    if (modal.type !== 'updateSchedule') return;
    if (schedDays.length === 0 && schedSlot === '') return err('Chọn ít nhất ngày hoặc slot');
    setLoading(true);
    try {
      await api.put(`/admin/classes/${modal.cls.id}/schedule`, { schedule: buildScheduleString(schedDays, schedSlot, schedRoom), slotNumber: schedSlot !== '' ? schedSlot : undefined });
      ok('Cập nhật lịch thành công!'); closeModal(); resetSched(); loadClasses();
    } catch (e: any) { err(e.response?.data?.message || 'Lỗi'); } finally { setLoading(false); }
  };

  useEffect(() => { loadClasses(); loadSlots(); }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Quản lý Lớp Học</h1>
            <p className="text-sm text-slate-400 mt-0.5">{classes.length} lớp trong hệ thống</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadClasses} disabled={loading} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-medium transition">
              <span className={loading ? 'inline-block animate-spin' : ''}>↻</span> Tải lại
            </button>
            <Btn variant="emerald" onClick={() => { resetSched(); setModal({ type: 'createClass' }); }}>+ Tạo lớp</Btn>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 px-4 py-3 flex items-center gap-3">
          <span className="text-slate-300 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm lớp, mã lớp, giáo viên..."
            className="flex-1 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none" />
          {search && <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-500">×</button>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-300 text-sm">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center"><div className="text-4xl mb-3">🏫</div><div className="text-slate-400 text-sm">{search ? 'Không tìm thấy' : 'Chưa có lớp học nào'}</div></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Lớp học', 'Mã lớp', 'Giáo viên', 'Lịch học', 'HS', 'Thao tác'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(cls => (
                  <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <ClassAvatar name={cls.name} />
                        <span className="font-semibold text-slate-800 text-sm">{cls.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><code className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-mono">{cls.code}</code></td>
                    <td className="px-5 py-4">
                      {cls.teacherName ? <span className="text-sm text-slate-600 flex items-center gap-1.5"><span>👨‍🏫</span>{cls.teacherName}</span> : <span className="text-xs text-slate-300 italic">Chưa gán</span>}
                    </td>
                    <td className="px-5 py-4">
                      {cls.schedule ? <span className="text-xs text-slate-500 flex items-center gap-1.5"><span>📅</span>{cls.schedule}</span> : <span className="text-xs text-slate-300 italic">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">👥 {cls.studentCount ?? 0}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Btn size="sm" variant="ghost" onClick={() => loadClassStudents(cls)}>HS</Btn>
                        <Btn size="sm" variant="purple" onClick={() => { loadTeachers(); setModal({ type: 'assignTeacher', cls }); }}>GV</Btn>
                        <Btn size="sm" variant="primary" onClick={() => { resetSched(); setModal({ type: 'updateSchedule', cls }); }}>📅</Btn>
                        <Btn size="sm" variant="danger" onClick={() => deleteClass(cls)}>✕</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal.type === 'createClass' && (
        <ModalWrap title="Tạo lớp học mới" onClose={closeModal}>
          <div className="space-y-4">
            <Input label="Tên lớp *" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} placeholder="vd: Lập trình Web 2025" />
            <Input label="Mã lớp *" value={newClass.code} onChange={e => setNewClass({ ...newClass, code: e.target.value.toUpperCase() })} placeholder="vd: WEB2025" />
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Lịch học</p>
              <SchedulePicker selectedDays={schedDays} onDaysChange={setSchedDays} selectedSlot={schedSlot} onSlotChange={setSchedSlot} room={schedRoom} onRoomChange={setSchedRoom} slots={slots} />
            </div>
            <Input label="Teacher ID (tùy chọn)" value={newClass.teacherId} onChange={e => setNewClass({ ...newClass, teacherId: e.target.value })} placeholder="ID giáo viên" />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Btn variant="ghost" onClick={closeModal}>Hủy</Btn>
              <Btn variant="emerald" onClick={createClass} disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo lớp'}</Btn>
            </div>
          </div>
        </ModalWrap>
      )}

      {modal.type === 'assignTeacher' && (
        <ModalWrap title="Gán giáo viên" subtitle={modal.cls.name} onClose={closeModal}>
          <div className="space-y-4">
            {modal.cls.teacherName && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600">
                <span>👨‍🏫</span> Hiện tại: <strong className="text-slate-800">{modal.cls.teacherName}</strong>
              </div>
            )}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Chọn giáo viên</label>
              <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white transition">
                <option value="">-- Chọn giáo viên --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.userName} ({t.email})</option>)}
              </select>
              {teachers.length === 0 && <p className="text-xs text-slate-300 italic mt-1">Đang tải...</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Btn variant="ghost" onClick={closeModal}>Hủy</Btn>
              <Btn variant="purple" onClick={assignTeacher} disabled={loading || !selectedTeacherId}>{loading ? 'Đang gán...' : 'Gán giáo viên'}</Btn>
            </div>
          </div>
        </ModalWrap>
      )}

      {modal.type === 'updateSchedule' && (
        <ModalWrap title="Cập nhật lịch học" subtitle={modal.cls.name} onClose={closeModal}>
          <div className="space-y-4">
            <SchedulePicker selectedDays={schedDays} onDaysChange={setSchedDays} selectedSlot={schedSlot} onSlotChange={setSchedSlot} room={schedRoom} onRoomChange={setSchedRoom} slots={slots} />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Btn variant="ghost" onClick={closeModal}>Hủy</Btn>
              <Btn onClick={updateSchedule} disabled={loading}>{loading ? 'Đang lưu...' : 'Cập nhật'}</Btn>
            </div>
          </div>
        </ModalWrap>
      )}

      {modal.type === 'classDetail' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <ClassAvatar name={modal.cls.name} />
                <div>
                  <h3 className="text-base font-bold text-slate-800">{modal.cls.name}</h3>
                  <p className="text-xs text-slate-400">{classStudents.length} học sinh</p>
                </div>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition text-xl">×</button>
            </div>
            <div className="px-6 py-5">
              {classStudents.length === 0 ? (
                <div className="py-12 text-center"><div className="text-3xl mb-2">👥</div><div className="text-sm text-slate-400">Lớp này chưa có học sinh</div></div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Học sinh', 'Email', 'Trạng thái', ''].map(h => (
                        <th key={h} className="text-left pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {classStudents.map(s => (
                      <tr key={s.enrollmentId} className="hover:bg-slate-50">
                        <td className="py-3 text-sm font-semibold text-slate-700">{s.studentName}</td>
                        <td className="py-3 text-sm text-slate-400">{s.email || '—'}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {s.status === 'Approved' ? '✓' : '⏳'} {s.status || 'Đang học'}
                          </span>
                        </td>
                        <td className="py-3"><Btn size="sm" variant="danger" onClick={() => removeStudent(s.enrollmentId, s.studentName)}>Xóa</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}