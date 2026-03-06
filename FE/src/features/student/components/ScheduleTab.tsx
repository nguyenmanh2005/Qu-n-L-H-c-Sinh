// src/features/student/components/ScheduleTab.tsx
import { useState } from 'react';
import type { ApprovedClass, ScheduleClass } from '../StudentDashboard';

interface Props {
  approvedClasses: ApprovedClass[];
  scheduleClasses?: ScheduleClass[];
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

// ── Parse helpers ─────────────────────────────────────────────────────────────

const DAY_MAP: Record<string, number> = {
  'thứ 2': 1, 'thu 2': 1, 't2': 1,
  'thứ 3': 2, 'thu 3': 2, 't3': 2,
  'thứ 4': 3, 'thu 4': 3, 't4': 3,
  'thứ 5': 4, 'thu 5': 4, 't5': 4,
  'thứ 6': 5, 'thu 6': 5, 't6': 5,
  'thứ 7': 6, 'thu 7': 6, 't7': 6,
  'cn': 0, 'chủ nhật': 0,
};

// Dùng làm fallback khi slotNumber không có — map timeStart → slot
const TIME_TO_SLOT: Record<string, number> = {
  '7:15': 1,  '07:15': 1,
  '9:25': 2,  '09:25': 2,
  '12:00': 3,
  '14:10': 4,
  '16:20': 5,
  '18:30': 6,
  '20:30': 7,
};

// Parse "Thứ 2, Thứ 4 – Slot 2" → [{ dow, slotNum }]
function parseScheduleString(raw: string): { dow: number; slotNum: number }[] {
  if (!raw) return [];
  const result: { dow: number; slotNum: number }[] = [];
  const lower = raw.toLowerCase();

  // Tách theo dấu ; trước, vì , dùng trong "Thứ 2, Thứ 4"
  const segments = lower.split(/[;|\/]+/);

  for (const seg of segments) {
    // Tìm tất cả ngày trong segment
    const dows: number[] = [];
    for (const [k, v] of Object.entries(DAY_MAP)) {
      if (seg.includes(k)) dows.push(v);
    }

    // Tìm slot
    const slotMatch = seg.match(/slot\s*([1-7])/i);
    const slotNum = slotMatch ? parseInt(slotMatch[1]) : 0;

    if (dows.length > 0 && slotNum > 0) {
      dows.forEach(dow => result.push({ dow, slotNum }));
    }
  }

  // Nếu không tách được → parse toàn bộ string
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

// ── Kiểu dữ liệu dùng trong grid ─────────────────────────────────────────────

interface GridEntry {
  name: string;
  code: string;
  teacher: string;
  color: typeof COLORS[0];
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ScheduleTab({ approvedClasses = [], scheduleClasses = [] }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today    = toISO(new Date());
  const weekDates = getWeekDates(weekOffset);
  const first    = weekDates[0];
  const last     = weekDates[6];
  const weekLabel = `${first.getDate()}/${first.getMonth() + 1} – ${last.getDate()}/${last.getMonth() + 1}/${last.getFullYear()}`;

  // ── Build grid { dow → { slotNum → GridEntry } } ─────────────────────────
  const grid: Record<number, Record<number, GridEntry>> = {};
  const legendItems: { name: string; code: string; color: typeof COLORS[0] }[] = [];

  if (scheduleClasses && scheduleClasses.length > 0) {
    scheduleClasses.forEach((cls, idx) => {
      const color = COLORS[idx % COLORS.length];
      legendItems.push({ name: cls.className, code: cls.classCode, color });

      const slots = cls.slots ?? [];

      if (slots.length > 0) {
        slots.forEach(slot => {
          // ✅ Ưu tiên slotNumber từ BE, fallback sang map timeStart
          const slotNum =
            slot.slotNumber ??
            TIME_TO_SLOT[slot.timeStart?.trim()] ??
            0;

          if (!slotNum) return;
          if (!grid[slot.dayOfWeek]) grid[slot.dayOfWeek] = {};
          grid[slot.dayOfWeek][slotNum] = {
            name:    cls.className,
            code:    cls.classCode,
            teacher: cls.teacherName,
            color,
          };
        });
      } else {
        // slots rỗng → parse từ scheduleRaw
        const parsed = parseScheduleString(cls.scheduleRaw ?? '');
        parsed.forEach(({ dow, slotNum }) => {
          if (!grid[dow]) grid[dow] = {};
          grid[dow][slotNum] = {
            name:    cls.className,
            code:    cls.classCode,
            teacher: cls.teacherName,
            color,
          };
        });
      }
    });
  } else {
    // Fallback: parse từ approvedClasses
    approvedClasses.forEach((cls, idx) => {
      const color = COLORS[idx % COLORS.length];
      legendItems.push({ name: cls.name, code: cls.code, color });

      if (cls.daysOfWeek && cls.daysOfWeek.length > 0 && cls.timeStart) {
        const slotNum = TIME_TO_SLOT[cls.timeStart.trim()] ?? 0;
        if (slotNum) {
          cls.daysOfWeek.forEach(dow => {
            if (!grid[dow]) grid[dow] = {};
            grid[dow][slotNum] = {
              name:    cls.name,
              code:    cls.code,
              teacher: cls.teacher ?? cls.teacherName ?? '',
              color,
            };
          });
        }
      } else {
        const parsed = parseScheduleString(cls.schedule ?? '');
        parsed.forEach(({ dow, slotNum }) => {
          if (!grid[dow]) grid[dow] = {};
          grid[dow][slotNum] = {
            name:    cls.name,
            code:    cls.code,
            teacher: cls.teacher ?? cls.teacherName ?? '',
            color,
          };
        });
      }
    });
  }

  const hasAnyClass = legendItems.length > 0;

  const navBtn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: '6px 16px', fontSize: '0.88em', border: 'none',
    borderRadius: 6, cursor: 'pointer', color: 'white',
    background: '#94a3b8', transition: 'background 0.2s', ...extra,
  });

  return (
    <div style={{
      background: 'white', borderRadius: 10,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      padding: 25, marginBottom: 30,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0 }}>📅 Thời khóa biểu</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
        </div>
      </div>

      {/* Grid */}
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
                      verticalAlign: 'top', height: 72,
                    }}>
                      {entry && (
                        <div
                          title={`${entry.name} | GV: ${entry.teacher}`}
                          style={{
                            background:  entry.color.bg,
                            border:      `1px solid ${entry.color.border}`,
                            borderLeft:  `4px solid ${entry.color.bar}`,
                            borderRadius: 6, padding: '6px 8px',
                            height: '100%', boxSizing: 'border-box',
                          }}
                        >
                          <div style={{
                            fontWeight: 700, fontSize: '0.78em', color: entry.color.text,
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          }}>
                            {entry.name}
                          </div>
                          <div style={{ fontSize: '0.7em', color: entry.color.text, opacity: 0.8, marginTop: 2 }}>
                            🏷️ {entry.code}
                          </div>
                          <div style={{ fontSize: '0.7em', color: entry.color.text, opacity: 0.8 }}>
                            👤 {entry.teacher || 'Chưa có GV'}
                          </div>
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
          <p>Bạn chưa có lịch học nào được duyệt.</p>
        </div>
      )}
    </div>
  );
}