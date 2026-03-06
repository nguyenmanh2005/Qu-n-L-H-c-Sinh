// src/features/teacher/components/ScheduleTab.tsx
import { useState, useEffect } from 'react';
import type { ClassInfo } from '../TeacherDashboard';

interface Props {
  allClasses: ClassInfo[];
  openModal: (cls: ClassInfo) => void;
}

const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function parseDayOfWeek(schedule: string): number[] {
  if (!schedule) return [];
  const map: Record<string, number> = { '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, 'CN': 0 };
  const days: number[] = [];
  for (const [k, v] of Object.entries(map)) {
    if (schedule.includes('Thứ ' + k) || schedule.includes(k)) days.push(v);
  }
  return [...new Set(days)];
}

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toISO(d: Date) { return d.toISOString().substring(0, 10); }

export default function ScheduleTab({ allClasses, openModal }: Props) {
  const [view, setView] = useState<'week' | 'list'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(toISO(new Date()));

  const today = toISO(new Date());
  const weekDates = getWeekDates(weekOffset);
  const first = weekDates[0], last = weekDates[6];
  const weekLabel = `${first.getDate()}/${first.getMonth() + 1} – ${last.getDate()}/${last.getMonth() + 1}/${last.getFullYear()}`;

  const dayClasses = allClasses.filter(cls => {
    const d = new Date(selectedDay + 'T00:00:00');
    return parseDayOfWeek(cls.schedule || '').includes(d.getDay());
  });

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', fontSize: '0.88em', border: 'none', borderRadius: 6,
    cursor: 'pointer', background: active ? '#3498db' : '#eee',
    color: active ? 'white' : '#333',
  });

  const navBtn: React.CSSProperties = {
    padding: '6px 14px', fontSize: '0.88em', border: 'none', borderRadius: 6,
    cursor: 'pointer', background: '#95a5a6', color: 'white',
  };

  return (
    <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 25, marginBottom: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0 }}>📅 Lịch học của tôi</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnStyle(view === 'week')} onClick={() => setView('week')}>Tuần</button>
          <button style={btnStyle(view === 'list')} onClick={() => setView('list')}>Danh sách</button>
        </div>
      </div>

      {/* ── Week view ── */}
      {view === 'week' && (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <button style={navBtn} onClick={() => setWeekOffset(o => o - 1)}>← Tuần trước</button>
            <span style={{ flex: 1, textAlign: 'center', fontWeight: 600, color: '#555' }}>{weekLabel}</span>
            <button style={navBtn} onClick={() => setWeekOffset(o => o + 1)}>Tuần sau →</button>
            <button
              style={{ ...navBtn, background: '#e67e22' }}
              onClick={() => { setWeekOffset(0); setSelectedDay(today); }}
            >Hôm nay</button>
          </div>

          {/* Week strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 20 }}>
            {weekDates.map((d, i) => {
              const iso = toISO(d);
              const isToday = iso === today;
              const isSelected = iso === selectedDay;
              return (
                <div
                  key={iso}
                  onClick={() => setSelectedDay(iso)}
                  style={{
                    textAlign: 'center', padding: '10px 4px',
                    borderRadius: 8,
                    border: isToday ? '2px solid #ff6b6b' : '1px solid #eee',
                    background: isSelected ? '#ff6b6b' : 'white',
                    color: isSelected ? 'white' : '#333',
                    cursor: 'pointer', transition: 'all 0.2s',
                    fontWeight: isToday ? 'bold' : 'normal',
                  }}
                >
                  <div style={{ fontSize: '0.75em', opacity: 0.8 }}>{DAY_NAMES[i]}</div>
                  <div style={{ fontSize: '1.1em', fontWeight: 700, marginTop: 2 }}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Day detail */}
          {(() => {
            const d = new Date(selectedDay + 'T00:00:00');
            const dateLabel = d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
            const isToday = selectedDay === today;
            if (!dayClasses.length) return (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#aaa' }}>
                <div style={{ fontSize: '2em', marginBottom: 8 }}>📅</div>
                <strong>{dateLabel}</strong>
                <p>Không có lịch dạy ngày này.</p>
              </div>
            );
            return (
              <>
                <h3 style={{ color: '#c0392b', marginBottom: 12 }}>📅 {dateLabel}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {dayClasses.map(cls => (
                    <div key={cls.id} style={{ display: 'flex', gap: 16, alignItems: 'stretch', background: 'white', borderRadius: 10, border: '1px solid #eee', overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                      <div style={{ width: 6, background: '#ff6b6b', flexShrink: 0 }} />
                      <div style={{ padding: '14px 16px', flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#c0392b', fontSize: '1.05em', marginBottom: 4 }}>{cls.name}</div>
                        <div style={{ color: '#666', fontSize: '0.9em', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <span>🏷️ {cls.code}</span>
                          <span>🕐 {cls.schedule || '—'}</span>
                          <span>👥 {cls.studentCount || 0} học sinh</span>
                        </div>
                      </div>
                      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                        {isToday && (
                          <button style={{ padding: '6px 14px', fontSize: '0.88em', border: 'none', borderRadius: 6, cursor: 'pointer', background: '#27ae60', color: 'white' }} onClick={() => openModal(cls)}>
                            📋 Điểm danh
                          </button>
                        )}
                        <button style={{ padding: '6px 14px', fontSize: '0.88em', border: 'none', borderRadius: 6, cursor: 'pointer', background: '#3498db', color: 'white' }} onClick={() => openModal(cls)}>
                          ⚙️ Quản lý
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </>
      )}

      {/* ── List view ── */}
      {view === 'list' && (
        <>
          {!allClasses.length ? (
            <p style={{ textAlign: 'center', color: '#777' }}>Bạn chưa phụ trách lớp nào.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {allClasses.map(cls => (
                <div key={cls.id} style={{ display: 'flex', gap: 16, alignItems: 'stretch', background: 'white', borderRadius: 10, border: '1px solid #eee', overflow: 'hidden' }}>
                  <div style={{ width: 6, background: '#ff6b6b', flexShrink: 0 }} />
                  <div style={{ padding: '14px 16px', flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#c0392b', fontSize: '1.05em', marginBottom: 4 }}>{cls.name}</div>
                    <div style={{ color: '#666', fontSize: '0.9em', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span>🏷️ Mã: {cls.code}</span>
                      <span>🕐 Lịch: {cls.schedule || 'Chưa cập nhật'}</span>
                      <span>📅 Bắt đầu: {cls.startDate ? new Date(cls.startDate).toLocaleDateString('vi-VN') : '—'}</span>
                      <span>👥 {cls.studentCount || 0} học sinh</span>
                    </div>
                  </div>
                  <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button style={{ padding: '6px 14px', fontSize: '0.88em', border: 'none', borderRadius: 6, cursor: 'pointer', background: '#27ae60', color: 'white' }} onClick={() => openModal(cls)}>📋 Điểm danh</button>
                    <button style={{ padding: '6px 14px', fontSize: '0.88em', border: 'none', borderRadius: 6, cursor: 'pointer', background: '#3498db', color: 'white' }} onClick={() => openModal(cls)}>⚙️ Quản lý</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}