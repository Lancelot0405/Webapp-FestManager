// =============================================================================
// Input — primitive UI dùng chung
// Gom mẫu ô nhập lặp lại khắp app: label gắn `htmlFor`, icon prefix tùy chọn,
// hiển thị lỗi với aria-invalid + aria-describedby cho screen reader.
// Lưu ý: font-size 16px được ép trong index.css để tránh iOS Safari auto-zoom.
// =============================================================================

import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Icon đặt bên trái trong ô. */
  icon?: ReactNode;
  /** Thông báo lỗi; khi có sẽ tô viền đỏ và gắn aria-invalid. */
  error?: string;
}

export default function Input({
  label,
  icon,
  error,
  id,
  className = '',
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  const fieldClass =
    'w-full py-3 rounded-xl border bg-white dark:bg-slate-700 dark:text-gray-100 ' +
    'transition-all focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 ' +
    (icon ? 'pl-9 pr-4 ' : 'px-4 ') +
    (error
      ? 'border-red-400 focus:border-red-400'
      : 'border-gray-200 dark:border-slate-600 focus:border-blue-400');

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${fieldClass} ${className}`}
          {...rest}
        />
      </div>
      {error && (
        <p id={errorId} className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
