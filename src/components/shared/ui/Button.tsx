import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'saffron';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl transition-all duration-150 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ' +
  'active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 shadow-[0_2px_8px_0_rgb(249_115_22/0.35)] ' +
    'hover:shadow-[0_4px_12px_0_rgb(249_115_22/0.45)] dark:bg-brand-400 dark:hover:bg-brand-500',
  saffron:
    'bg-saffron-500 text-espresso-800 hover:bg-saffron-600 shadow-[0_2px_8px_0_rgb(234_179_8/0.30)] ' +
    'hover:shadow-[0_4px_12px_0_rgb(234_179_8/0.40)] dark:bg-saffron-400 dark:text-espresso-800',
  secondary:
    'border border-brand-200 dark:border-brand-900 bg-brand-50 dark:bg-espresso-700 ' +
    'text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-espresso-700/80',
  danger:
    'bg-red-500 text-white hover:bg-red-600 shadow-[0_2px_8px_0_rgb(239_68_68/0.30)]',
  ghost:
    'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-espresso-700',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-5 py-3',
};

export default function Button({
  variant   = 'primary',
  size      = 'md',
  loading   = false,
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
