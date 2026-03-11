// src/styles.ts — design tokens dùng chung toàn app
export const C = {
  // Primary — xanh dương đậm
  primary:      '#2563eb',
  primaryLight: '#3b82f6',
  primaryDark:  '#1d4ed8',

  // Accent theo role
  teacher:  '#7c3aed',   // tím
  student:  '#059669',   // xanh lá
  admin:    '#dc2626',   // đỏ

  // Status
  success:  '#10b981',
  warning:  '#f59e0b',
  danger:   '#ef4444',
  info:     '#3b82f6',

  // Neutral
  bg:       '#f8fafc',
  surface:  '#ffffff',
  border:   '#e2e8f0',
  text:     '#1e293b',
  textMuted:'#64748b',
  textLight:'#94a3b8',
};

export const S = {
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    border: `1px solid ${C.border}`,
  } as React.CSSProperties,

  btn: (color = C.primary): React.CSSProperties => ({
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '9px 18px',
    cursor: 'pointer',
    fontSize: '0.9em',
    fontWeight: 600,
    transition: 'opacity .15s',
  }),

  btnOutline: (color = C.primary): React.CSSProperties => ({
    background: 'transparent',
    color: color,
    border: `1.5px solid ${color}`,
    borderRadius: 8,
    padding: '8px 18px',
    cursor: 'pointer',
    fontSize: '0.9em',
    fontWeight: 600,
  }),

  badge: (color: string, bg: string): React.CSSProperties => ({
    background: bg,
    color: color,
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: '0.78em',
    fontWeight: 600,
    display: 'inline-block',
  }),

  input: {
    width: '100%',
    padding: '9px 12px',
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    fontSize: '0.95em',
    outline: 'none',
    boxSizing: 'border-box',
    color: C.text,
    background: '#fff',
  } as React.CSSProperties,

  label: {
    display: 'block',
    marginBottom: 6,
    fontWeight: 600,
    fontSize: '0.88em',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  } as React.CSSProperties,
};

import React from 'react';
