// src/features/admin/components/Toast.tsx
import { useEffect } from 'react';

interface Props {
  msg: string;
  type: 'ok' | 'err';
  onClose: () => void;
  /** Thời gian tự động đóng (ms). Mặc định 3500ms */
  duration?: number;
}

/**
 * Toast notification dùng chung cho toàn bộ admin.
 * Thay thế 3 bản copy trong AdminGrades, ClassManagement, UserManagement.
 *
 * Cách dùng:
 *   const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
 *   {toast && <Toast {...toast} onClose={() => setToast(null)} />}
 */
export default function Toast({ msg, type, onClose, duration = 3500 }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div
      className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3
        rounded-xl shadow-2xl text-white text-sm font-semibold
        ${type === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`}
    >
      <span className="text-base">{type === 'ok' ? '✓' : '✕'}</span>
      <span>{msg}</span>
      <button
        onClick={onClose}
        className="ml-1 opacity-60 hover:opacity-100 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}