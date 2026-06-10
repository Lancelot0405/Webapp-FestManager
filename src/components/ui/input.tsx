import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  inputClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, inputClassName, id, ...props }, ref) => {
    const genId = React.useId()
    const inputId = id ?? genId

    return (
      <div className={cn("flex flex-col gap-1 w-full", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] [&_svg]:size-4 pointer-events-none z-10">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-9 w-full rounded-md border border-[var(--border-color)] bg-transparent px-3 py-1 text-base text-[var(--text-primary)] shadow-sm transition-colors",
              "placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]",
              "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              "dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]",
              icon && "pl-9",
              error && "border-[var(--destructive)] focus:ring-[var(--destructive)]",
              inputClassName
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-[var(--destructive)]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
