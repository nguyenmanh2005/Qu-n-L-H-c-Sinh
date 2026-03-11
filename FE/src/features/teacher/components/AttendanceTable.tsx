// src/features/teacher/components/AttendanceTable.tsx
import { useEffect, useState } from 'react';
import { useTeacherApi } from '../hooks/useTeacherApi';

interface Student {
  studentId: string;
  studentName: string;
  email?: string;
  status: string;
}

interface AttendanceRecord {
  studentId: string;
  present: boolean;
}

interface AttendanceTableProps {
  classId: number;
}

export default function AttendanceTable({ classId }: AttendanceTableProps) {
  const api = useTeacherApi();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  // Fetch trực tiếp trong effect — không gọi setState từ hàm bên ngoài
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const studRes = await api.get(`/classes/${classId}/students`);
        const approved: Student[] =
          studRes.data.students?.filter((s: Student) => s.status === 'Approved') ?? [];

        const attRes = await api.get(`/classes/${classId}/attendance?date=${date}`);
        const attMap: Record<string, boolean> = {};
        (attRes.data as AttendanceRecord[]).forEach(a => {
          attMap[a.studentId] = a.present;
        });

        if (!cancelled) {
          setStudents(approved);
          setAttendance(attMap);
        }
      } catch {
        // lỗi network / 404
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [classId, date]); // eslint-disable-line react-hooks/exhaustive-deps
  // api object thay đổi mỗi render (axios.create) nên không đưa vào deps

  const togglePresent = (studentId: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const saveAttendance = async () => {
    const entries = students.map(s => ({
      studentId: s.studentId,
      present: attendance[s.studentId] ?? false,
    }));
    try {
      await api.post(`/classes/${classId}/attendance`, { date, entries });
      alert('Đã lưu điểm danh thành công!');
    } catch {
      alert('Lỗi khi lưu điểm danh');
    }
  };

  // Force re-run effect với cùng date (dùng cho nút "Tải danh sách")
  const reloadDate = () => setDate(d => d + ' ');

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Ngày điểm danh</label>
          <input
            type="date"
            value={date.trim()}
            onChange={e => setDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <button
          onClick={reloadDate}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Tải danh sách
        </button>
        <button
          onClick={saveAttendance}
          className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Lưu điểm danh
        </button>
      </div>

      {students.length === 0 ? (
        <p className="text-center text-gray-500 py-10">Chưa có học sinh hoặc chưa tải dữ liệu</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Họ tên</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-center">Có mặt</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.studentId} className="border-b hover:bg-gray-50">
                <td className="p-3">{s.studentName}</td>
                <td className="p-3">{s.email ?? '—'}</td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={attendance[s.studentId] ?? false}
                    onChange={() => togglePresent(s.studentId)}
                    className="w-5 h-5"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}