// src/features/admin/components/FormField.tsx
import React from 'react';

// ── Field wrapper ──────────────────────────────────────────────────────────────
/**
 * Label + bất kỳ input nào làm children.
 *
 * Cách dùng:
 *   <Field label="Email">
 *     <input ... />
 *   </Field>
 */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────────
/**
 * Input có label tích hợp sẵn.
 *
 * Cách dùng:
 *   <Input label="Tên lớp" value={name} onChange={...} placeholder="VD: Toán 10A" />
 */
export function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label}>
      <input
        {...props}
        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700
          focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
          transition placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400"
      />
    </Field>
  );
}

// ── Btn ────────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'danger' | 'ghost' | 'purple' | 'emerald' | 'amber';
type BtnSize    = 'sm' | 'md' | 'lg';

const VARIANT_CLS: Record<BtnVariant, string> = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200',
  danger:  'bg-red-500   hover:bg-red-600   text-white',
  ghost:   'bg-slate-100 hover:bg-slate-200 text-slate-600',
  purple:  'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200',
  emerald: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-100',
  amber:   'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-100',
};

const SIZE_CLS: Record<BtnSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2   text-sm',
  lg: 'px-5 py-2.5 text-base',
};

/**
 * Button dùng chung.
 *
 * Cách dùng:
 *   <Btn variant="primary" onClick={save}>Lưu</Btn>
 *   <Btn variant="danger"  size="sm">Xóa</Btn>
 */
export function Btn({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: {
  variant?: BtnVariant;
  size?: BtnSize;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`
        ${VARIANT_CLS[variant]} ${SIZE_CLS[size]}
        rounded-lg font-semibold disabled:opacity-40 transition-all
        ${className}
      `}
    />
  );
}