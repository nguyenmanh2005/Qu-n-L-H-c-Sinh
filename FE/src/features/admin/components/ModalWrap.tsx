
// src/features/admin/components/ModalWrap.tsx
import React from 'react';

interface Props {
  title: string;
  subtitle?: string;
  /** max-w-* Tailwind class. Mặc định: max-w-lg */
  maxWidth?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Wrapper modal dùng chung cho toàn bộ admin.
 * Thay thế 2 bản copy trong ClassManagement và UserManagement.
 *
 * Cách dùng:
 *   <ModalWrap title="Tạo lớp học" subtitle="Điền thông tin bên dưới" onClose={close}>
 *     ...nội dung...
 *   </ModalWrap>
 */
export default function ModalWrap({ title, subtitle, maxWidth = 'max-w-lg', onClose, children }: Props) {
  // Click backdrop → đóng modal
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}