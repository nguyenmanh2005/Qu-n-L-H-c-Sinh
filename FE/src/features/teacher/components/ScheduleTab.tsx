// src/features/teacher/components/ScheduleTab.tsx
import { useState, useEffect } from 'react';
import type { ClassInfo } from '../TeacherDashboard';

interface Props {
  allClasses: ClassInfo[];
  openModal: (cls: ClassInfo) => void;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const SLOT_TIMES = [
  { slot: 1, label: 'Slot 1', time: '7:15 – 9:15'   },
  { slot: 2, label: 'Slot 2', time: '9:25 – 11:25'  },
  { slot: 3, label: 'Slot 3', time: '12:00 – 14:00' },
  { slot: 4, label: 'Slot 4', time: '14:10 – 16:10' },
  { slot: 5, label: 'Slot 5', time: '16:20 – 18:20' },
  { slot: 6, label: 'Slot 6', time: '18:30 – 20:30' },
  { slot: 7, label: 'Slot 7', time: '20:30 – 22:30' },
];

// Thời điểm bắt đầu của từng slot (dùng để tính cửa sổ điểm danh)
const SLOT_START: Record<number, { h: number; m: number }> = {
  1: { h: 7,  m: 15 },
  2: { h: 9,  m: 25 },
  3: { h: 12, m: 0  },
  4: { h: 14, m: 10 },
  5: { h: 16, m: 20 },
  6: { h: 18, m: 30 },
  7: { h: 20, m: 30 },
};

const ATTENDANCE_WINDOW_MINUTES = 30;

/**
 * Trả về trạng thái điểm danh cho slot:
 * - 'not-today'  : không phải hôm nay
 * - 'not-started': chưa đến giờ bắt đầu slot
 * - 'open'       : đang trong cửa sổ điểm danh (từ timeStart → +30 phút)
 * - 'locked'     : đã qua 30 phút, khoá điểm danh
 */
function getAttendanceStatus(slotNum: number, isToday: boolean, now: Date): 'not-today' | 'not-started' | 'open' | 'locked' {
  if (!isToday) return 'not-today';
  const start = SLOT_START[slotNum];
  if (!start) return 'not-today';

  const startMinutes = start.h * 60 + start.m;
  const nowMinutes   = now.getHours() * 60 + now.getMinutes();

  if (nowMinutes < startMinutes)                              return 'not-started';
  if (nowMinutes <= startMinutes + ATTENDANCE_WINDOW_MINUTES) return 'open';
  return 'locked';
}

const DAY_COLS = [
  { label: 'Thứ 2', dow: 1 },
  { label: 'Thứ 3', dow: 2 },
  { label: 'Thứ 4', dow: 3 },
  { label: 'Thứ 5', dow: 4 },
  { label: 'Thứ 6', dow: 5 },
  { label: 'Thứ 7', dow: 6 },
  { label: 'CN',    dow: 0 },
];

const COLORS = [
  { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', bar: '#3b82f6' },
  { bg: '#ede9fe', border: '#7c3aed', text: '#4c1d95', bar: '#7c3aed' },
  { bg: '#dcfce7', border: '#16a34a', text: '#14532d', bar: '#16a34a' },
  { bg: '#fef9c3', border: '#ca8a04', text: '#713f12', bar: '#ca8a04' },
  { bg: '#fee2e2', border: '#dc2626', text: '#7f1d1d', bar: '#dc2626' },
  { bg: '#ffedd5', border: '#ea580c', text: '#7c2d12', bar: '#ea580c' },
];

// ── Parse helpers ──────────────────────────────────────────────────────────────

const TIME_TO_SLOT: Record<string, number> = {
  '7:15': 1, '07:15': 1,
  '9:25': 2, '09:25': 2,
  '12:00': 3,
  '14:10': 4,
  '16:20': 5,
  '18:30': 6,
  '20:30': 7,
};

const DAY_MAP: Record<string, number> = {
  'thứ 2': 1, 'thu 2': 1, 't2': 1,
  'thứ 3': 2, 'thu 3': 2, 't3': 2,
  'thứ 4': 3, 'thu 4': 3, 't4': 3,
  'thứ 5': 4, 'thu 5': 4, 't5': 4,
  'thứ 6': 5, 'thu 6': 5, 't6': 5,
  'thứ 7': 6, 'thu 7': 6, 't7': 6,
  'cn': 0, 'chủ nhật': 0,
};

function parseSchedule(raw: string): { dow: number; slotNum: number }[] {
  if (!raw) return [];
  const lower = raw.toLowerCase();
  const result: { dow: number; slotNum: number }[] = [];
  const segments = lower.split(/[;|\/]+/);

  for (const seg of segments) {
    const dows: number[] = [];
    for (const [k, v] of Object.entries(DAY_MAP)) {
      if (seg.includes(k)) dows.push(v);
    }
    const slotMatch = seg.match(/slot\s*([1-7])/i);
    const slotNum = slotMatch ? parseInt(slotMatch[1]) : 0;
    if (dows.length > 0 && slotNum > 0) {
      dows.forEach(dow => result.push({ dow, slotNum }));
    }
  }

  if (result.length === 0) {
    const dows: number[] = [];
    for (const [k, v] of Object.entries(DAY_MAP)) {
      if (lower.includes(k)) dows.push(v);
    }
    const slotMatch = lower.match(/slot\s*([1-7])/i);
    const slotNum = slotMatch ? parseInt(slotMatch[1]) : 0;
    if (dows.length > 0 && slotNum > 0) {
      dows.forEach(dow => result.push({ dow, slotNum }));
    }
  }

  return result;
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

function toISO(d: Date) {
  return d.toISOString().substring(0, 10);
}

interface GridEntry {
  cls: ClassInfo;
  color: typeof COLORS[0];
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ScheduleTab({ allClasses, openModal }: Props) {
  const [view, setView] = useState<'week' | 'list'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [now, setNow] = useState(new Date());

  // Cập nhật giờ mỗi 30 giây để tự động khoá/mở điểm danh
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const today     = toISO(now);
  const weekDates = getWeekDates(weekOffset);
  const first     = weekDates[0];
  const last      = weekDates[6];
  const weekLabel = `${first.getDate()}/${first.getMonth() + 1} – ${last.getDate()}/${last.getMonth() + 1}/${last.getFullYear()}`;

  // ── Build grid ─────────────────────────────────────────────────────────────
  const grid: Record<number, Record<number, GridEntry>> = {};
  const legendItems: { name: string; code: string; color: typeof COLORS[0] }[] = [];

  allClasses.forEach((cls, idx) => {
    const color = COLORS[idx % COLORS.length];
    legendItems.push({ name: cls.name, code: cls.code, color });

    const parsed = parseSchedule(cls.schedule ?? '');
    parsed.forEach(({ dow, slotNum }) => {
      if (!grid[dow]) grid[dow] = {};
      grid[dow][slotNum] = { cls, color };
    });
  });

  const hasAnyClass = legendItems.length > 0;

  const navBtn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: '6px 16px', fontSize: '0.88em', border: 'none',
    borderRadius: 6, cursor: 'pointer', color: 'white',
    background: '#94a3b8', transition: 'background 0.2s', ...extra,
  });

  const viewBtn = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px', fontSize: '0.88em', border: 'none',
    borderRadius: 6, cursor: 'pointer',
    background: active ? '#3b82f6' : '#f1f5f9',
    color: active ? 'white' : '#475569',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.2s',
  });

  return (
    <div style={{
      background: 'white', borderRadius: 10,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      padding: 25, marginBottom: 30,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0 }}>📅 Lịch dạy của tôi</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 4 }}>
            <button style={viewBtn(view === 'week')} onClick={() => setView('week')}>Tuần</button>
            <button style={viewBtn(view === 'list')} onClick={() => setView('list')}>Danh sách</button>
          </div>

          {/* Week nav — only in week view */}
          {view === 'week' && (
            <>
              <button
                style={navBtn()}
                onMouseEnter={e => (e.currentTarget.style.background = '#64748b')}
                onMouseLeave={e => (e.currentTarget.style.background = '#94a3b8')}
                onClick={() => setWeekOffset(o => o - 1)}
              >← Tuần trước</button>

              <span style={{
                padding: '6px 16px', background: '#f1f5f9', borderRadius: 6,
                fontWeight: 600, color: '#475569', fontSize: '0.9em',
                minWidth: 160, textAlign: 'center',
              }}>{weekLabel}</span>

              <button
                style={navBtn()}
                onMouseEnter={e => (e.currentTarget.style.background = '#64748b')}
                onMouseLeave={e => (e.currentTarget.style.background = '#94a3b8')}
                onClick={() => setWeekOffset(o => o + 1)}
              >Tuần sau →</button>

              <button
                style={navBtn({ background: '#f97316' })}
                onMouseEnter={e => (e.currentTarget.style.background = '#ea580c')}
                onMouseLeave={e => (e.currentTarget.style.background = '#f97316')}
                onClick={() => setWeekOffset(0)}
              >Hôm nay</button>
            </>
          )}
        </div>
      </div>

      {/* ── Week view ── */}
      {view === 'week' && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700, tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{
                    width: 110, padding: '10px 8px', background: '#f8fafc',
                    border: '1px solid #e2e8f0', fontSize: '0.8em',
                    color: '#64748b', fontWeight: 600, textAlign: 'center',
                  }}>Slot / Buổi</th>

                  {DAY_COLS.map(col => {
                    const date    = weekDates[col.dow === 0 ? 6 : col.dow - 1];
                    const isToday = toISO(date) === today;
                    return (
                      <th key={col.dow} style={{
                        padding: '10px 6px', textAlign: 'center',
                        border: '1px solid #e2e8f0',
                        background: isToday ? '#eff6ff' : '#f8fafc',
                        borderTop: isToday ? '3px solid #3b82f6' : '1px solid #e2e8f0',
                      }}>
                        <div style={{ fontSize: '0.85em', fontWeight: 700, color: isToday ? '#1d4ed8' : '#374151' }}>
                          {col.label}
                        </div>
                        <div style={{ fontSize: '0.78em', color: isToday ? '#3b82f6' : '#94a3b8', marginTop: 2 }}>
                          {date.getDate()}/{date.getMonth() + 1}
                        </div>
                        {isToday && (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', margin: '4px auto 0' }} />
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {SLOT_TIMES.map(({ slot, label, time }) => (
                  <tr key={slot}>
                    <td style={{
                      padding: '8px', border: '1px solid #e2e8f0',
                      background: '#f8fafc', textAlign: 'center', verticalAlign: 'middle',
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85em', color: '#374151' }}>{label}</div>
                      <div style={{ fontSize: '0.72em', color: '#94a3b8', marginTop: 2 }}>{time}</div>
                    </td>

                    {DAY_COLS.map(col => {
                      const date    = weekDates[col.dow === 0 ? 6 : col.dow - 1];
                      const isToday = toISO(date) === today;
                      const entry   = grid[col.dow]?.[slot];

                      return (
                        <td key={col.dow} style={{
                          padding: 4, border: '1px solid #e2e8f0',
                          background: isToday ? '#fafcff' : 'white',
                          verticalAlign: 'top', height: 80,
                        }}>
                          {entry && (
                            <div
                              title={`${entry.cls.name} | ${entry.cls.studentCount ?? 0} học sinh`}
                              style={{
                                background:   entry.color.bg,
                                border:       `1px solid ${entry.color.border}`,
                                borderLeft:   `4px solid ${entry.color.bar}`,
                                borderRadius: 6, padding: '6px 8px',
                                height: '100%', boxSizing: 'border-box',
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                              }}
                            >
                              <div>
                                <div style={{
                                  fontWeight: 700, fontSize: '0.78em', color: entry.color.text,
                                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                                }}>
                                  {entry.cls.name}
                                </div>
                                <div style={{ fontSize: '0.7em', color: entry.color.text, opacity: 0.8, marginTop: 2 }}>
                                  🏷️ {entry.cls.code}
                                </div>
                                <div style={{ fontSize: '0.7em', color: entry.color.text, opacity: 0.8 }}>
                                  👥 {entry.cls.studentCount ?? 0} HS
                                </div>
                              </div>

                              {/* Action buttons theo trạng thái điểm danh */}
                              {(() => {
                                const status = getAttendanceStatus(slot, isToday, now);
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                                    {status === 'open' && (
                                      <button
                                        onClick={() => openModal(entry.cls)}
                                        style={{
                                          width: '100%', padding: '2px 0', fontSize: '0.65em',
                                          border: 'none', borderRadius: 4, cursor: 'pointer',
                                          background: '#16a34a', color: 'white', fontWeight: 600,
                                        }}
                                      >📋 Điểm danh</button>
                                    )}
                                    {status === 'locked' && (
                                      <div style={{
                                        width: '100%', padding: '2px 4px', fontSize: '0.62em',
                                        borderRadius: 4, background: '#fee2e2',
                                        color: '#dc2626', fontWeight: 600, textAlign: 'center',
                                      }}>🔒 Đã khoá</div>
                                    )}
                                    {status === 'not-started' && (
                                      <div style={{
                                        width: '100%', padding: '2px 4px', fontSize: '0.62em',
                                        borderRadius: 4, background: '#fef9c3',
                                        color: '#92400e', fontWeight: 600, textAlign: 'center',
                                      }}>⏳ Chưa đến giờ</div>
                                    )}
                                    <button
                                      onClick={() => openModal(entry.cls)}
                                      style={{
                                        width: '100%', padding: '2px 0', fontSize: '0.65em',
                                        border: 'none', borderRadius: 4, cursor: 'pointer',
                                        background: entry.color.border, color: 'white', fontWeight: 600, opacity: 0.85,
                                      }}
                                    >⚙️ Quản lý</button>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          {hasAnyClass && (
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {legendItems.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 20,
                  background: item.color.bg, border: `1px solid ${item.color.border}`,
                  fontSize: '0.8em', fontWeight: 600, color: item.color.text,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color.bar }} />
                  {item.name} ({item.code})
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!hasAnyClass && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
              <div style={{ fontSize: '3em', marginBottom: 8 }}>📭</div>
              <p>Bạn chưa phụ trách lớp nào.</p>
            </div>
          )}
        </>
      )}

      {/* ── List view ── */}
      {view === 'list' && (
        <>
          {!allClasses.length ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
              <div style={{ fontSize: '3em', marginBottom: 8 }}>📭</div>
              <p>Bạn chưa phụ trách lớp nào.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allClasses.map((cls, idx) => {
                const color = COLORS[idx % COLORS.length];
                return (
                  <div key={cls.id} style={{
                    display: 'flex', gap: 0, alignItems: 'stretch',
                    background: 'white', borderRadius: 10,
                    border: `1px solid ${color.border}`, overflow: 'hidden',
                  }}>
                    <div style={{ width: 6, background: color.bar, flexShrink: 0 }} />
                    <div style={{ padding: '14px 16px', flex: 1 }}>
                      <div style={{ fontWeight: 700, color: color.text, fontSize: '1em', marginBottom: 4 }}>
                        {cls.name}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.85em', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span>🏷️ {cls.code}</span>
                        <span>🕐 {cls.schedule || 'Chưa cập nhật'}</span>
                        <span>📅 Bắt đầu: {cls.startDate ? new Date(cls.startDate).toLocaleDateString('vi-VN') : '—'}</span>
                        <span>👥 {cls.studentCount ?? 0} học sinh</span>
                      </div>
                    </div>
                    <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {/* Điểm danh chỉ khả dụng hôm nay, trong cửa sổ slot */}
                      {(() => {
                        // Parse slot từ schedule string để check cửa sổ
                        const parsed = parseSchedule(cls.schedule ?? '');
                        const todayDow = now.getDay();
                        const todaySlot = parsed.find(p => p.dow === todayDow);
                        const status = todaySlot
                          ? getAttendanceStatus(todaySlot.slotNum, true, now)
                          : 'not-today';

                        if (status === 'open') return (
                          <button
                            onClick={() => openModal(cls)}
                            style={{
                              padding: '6px 14px', fontSize: '0.85em', border: 'none',
                              borderRadius: 6, cursor: 'pointer', background: '#16a34a', color: 'white', fontWeight: 600,
                            }}
                          >📋 Điểm danh</button>
                        );
                        if (status === 'locked') return (
                          <span style={{
                            padding: '6px 14px', fontSize: '0.82em', borderRadius: 6,
                            background: '#fee2e2', color: '#dc2626', fontWeight: 600,
                          }}>🔒 Đã khoá</span>
                        );
                        if (status === 'not-started') return (
                          <span style={{
                            padding: '6px 14px', fontSize: '0.82em', borderRadius: 6,
                            background: '#fef9c3', color: '#92400e', fontWeight: 600,
                          }}>⏳ Chưa đến giờ</span>
                        );
                        return null; // not-today: không hiện gì
                      })()}
                      <button
                        onClick={() => openModal(cls)}
                        style={{
                          padding: '6px 14px', fontSize: '0.85em', border: 'none',
                          borderRadius: 6, cursor: 'pointer', background: color.border, color: 'white', fontWeight: 600,
                        }}
                      >⚙️ Quản lý</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}