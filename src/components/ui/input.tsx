import * as React from "react"
import {
  TextField,
  Label,
  Input as HeroInput,
  FieldError,
  Description,
  type TextFieldProps,
} from "@heroui/react"
import { cn } from "@/lib/utils"

export interface InputProps extends Omit<TextFieldProps, 'children'> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  placeholder?: string
  type?: React.HTMLInputTypeAttribute
  className?: string
  inputClassName?: string
  defaultValue?: string
  autoComplete?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, inputClassName, placeholder, type, ...props }, _ref) => {
    return (
      <TextField
        isInvalid={!!error}
        className={cn("flex flex-col gap-1 w-full", className)}
        {...props}
      >
        {label && (
          <Label className="text-sm font-medium text-[var(--text-primary)]">
            {label}
          </Label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] [&_svg]:size-4 pointer-events-none z-10">
              {icon}
            </span>
          )}
          <HeroInput
            placeholder={placeholder}
            type={type}
            className={cn(
              "h-9 w-full rounded-md border border-[var(--border-color)] bg-transparent px-3 py-1 text-base text-[var(--text-primary)] shadow-sm transition-colors",
              "placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]",
              "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              "dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]",
              icon && "pl-9",
              error && "border-[var(--destructive)] focus:ring-[var(--destructive)]",
              inputClassName
            )}
          />
        </div>
        {error && <FieldError className="text-xs text-[var(--destructive)]">{error}</FieldError>}
        {hint && !error && <Description className="text-xs text-[var(--text-muted)]">{hint}</Description>}
      </TextField>
    )
  }
)
Input.displayName = "Input"

export { Input }
