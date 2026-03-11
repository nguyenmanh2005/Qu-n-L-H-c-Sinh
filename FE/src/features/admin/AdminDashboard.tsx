// src/features/admin/AdminDashboard.tsx
import React from 'react';


export default function AdminDashboard() {
  // const stats = [
  //   { label: 'Người dùng', value: '—', icon: '👤', color: 'from-violet-500 to-purple-600', light: 'bg-violet-50 text-violet-700' },
  //   { label: 'Lớp học',    value: '—', icon: '🏫', color: 'from-emerald-500 to-teal-600',  light: 'bg-emerald-50 text-emerald-700' },
  //   { label: 'Giáo viên',  value: '—', icon: '👨‍🏫', color: 'from-sky-500 to-blue-600',     light: 'bg-sky-50 text-sky-700' },
  //   { label: 'Học sinh',   value: '—', icon: '🎓', color: 'from-amber-500 to-orange-500',  light: 'bg-amber-50 text-amber-700' },
  // ];

  // const actions = [
  //   { label: 'Tạo người dùng mới', desc: 'Thêm học sinh, giáo viên hoặc admin', icon: '➕', color: 'border-violet-200 hover:border-violet-400 hover:bg-violet-50' },
  //   { label: 'Tạo lớp học',        desc: 'Thiết lập lớp và phân công giáo viên',  icon: '🏫', color: 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50' },
  //   { label: 'Phân công lịch học',  desc: 'Cập nhật slot và ngày học cho lớp',    icon: '📅', color: 'border-sky-200 hover:border-sky-400 hover:bg-sky-50' },
  //   { label: 'Quản lý role',        desc: 'Gán quyền hạn cho người dùng',         icon: '🔑', color: 'border-amber-200 hover:border-amber-400 hover:bg-amber-50' },
  // ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-10 sm:px-8">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg shadow-md flex-shrink-0">
              ⚡
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Admin Dashboard</h1>
              <p className="text-sm text-slate-400 leading-snug">Hệ thống quản lý sinh viên</p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-transparent mt-6" />
        </div>


        {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className={`h-1.5 w-full bg-gradient-to-r ${s.color}`} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3"> 
                  <span className="text-2xl leading-none">{s.icon}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${s.light}`}>
                    {s.label}
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-700 leading-none mb-1">{s.value}</div>
                <div className="text-xs text-slate-400 mt-1">Chọn mục bên sidebar để xem</div>
              </div>
            </div>
          ))}
        </div>

       
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                className={`flex items-center gap-4 p-4 bg-white rounded-xl border-2 cursor-pointer transition-all duration-150 text-left w-full ${a.color}`}
              >
                <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-xl flex-shrink-0 border border-slate-100">
                  {a.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-700 text-sm leading-snug">{a.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-snug">{a.desc}</div>
                </div>
                <span className="text-slate-300 text-lg flex-shrink-0">›</span>
              </button>
            ))}
          </div>
        </div>

        
        <div className="mt-10 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
          <span className="text-indigo-400 text-lg mt-0.5 flex-shrink-0">💡</span>
          <div>
            <div className="text-sm font-semibold text-indigo-700 leading-snug">Bắt đầu từ đây</div>
            <div className="text-xs text-indigo-500 mt-0.5 leading-relaxed">
              Sử dụng sidebar bên trái để điều hướng đến{' '}
              <strong className="font-bold">Quản lý User</strong> hoặc{' '}
              <strong className="font-bold">Quản lý Lớp</strong>.
            </div>
          </div>
        </div> */}

      </div>
    </div>
  );
}