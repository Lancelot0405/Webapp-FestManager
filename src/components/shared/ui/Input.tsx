import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?:  ReactNode;
  error?: string;
  hint?:  string;
}

export default function Input({
  label,
  icon,
  error,
  hint,
  id,
  className = '',
  ...rest
}: InputProps) {
  const autoId  = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  const fieldClass =
    'w-full py-3 rounded-xl border font-sans transition-all focus:outline-none focus:ring-2 ' +
    'bg-white dark:bg-espresso-700 text-espresso-800 dark:text-espresso-50 ' +
    'placeholder:text-brand-300 dark:placeholder:text-espresso-100/40 ' +
    (icon ? 'pl-9 pr-4 ' : 'px-4 ') +
    (error
      ? 'border-red-400 focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900'
      : 'border-brand-200 dark:border-espresso-700 focus:border-brand-500 focus:ring-brand-100 dark:focus:ring-brand-900');

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1 block"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? `${inputId}-hint` : undefined}
          className={`${fieldClass} ${className}`}
          {...rest}
        />
      </div>
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-brand-500 dark:text-brand-400 mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
