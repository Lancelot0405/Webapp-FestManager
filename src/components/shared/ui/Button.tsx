// =============================================================================
// Button — primitive UI dùng chung
// Mục tiêu: gom các biến thể nút lặp lại khắp app về một chỗ, đảm bảo nhất quán
// (bo góc, padding, dark mode, focus ring) và có sẵn accessibility.
// =============================================================================

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Hiện spinner và khóa nút khi đang xử lý. */
  loading?: boolean;
  /** Icon đặt trước label. */
  leftIcon?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-1.5 font-medium rounded-xl transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 ' +
             'text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-600',
  danger:    'bg-red-600 text-white hover:bg-red-700',
  ghost:     'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-3',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      )}
      {!loading && leftIcon}
      {children}
    </button>
  );
}
