import * as React from "react"
import {
  TextField,
  Label,
  InputRoot,
  FieldError,
  Description,
  type TextFieldRootProps,
} from "@heroui/react"
import { cn } from "@/lib/utils"

export interface InputProps extends Omit<TextFieldRootProps, "children"> {
  label?: string
  error?: string
  hint?: string
  startContent?: React.ReactNode
  endContent?: React.ReactNode
  placeholder?: string
  type?: React.HTMLInputTypeAttribute
  className?: string
  inputClassName?: string
  autoComplete?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    hint,
    startContent,
    endContent,
    className,
    inputClassName,
    placeholder,
    type,
    ...props
  }) => {
    return (
      <TextField
        isInvalid={!!error}
        className={cn("flex w-full flex-col gap-1", className)}
        {...props}
      >
        {label && (
          <Label className="text-xs font-medium text-[var(--text-secondary)]">
            {label}
          </Label>
        )}
        <div className="relative flex items-center">
          {startContent && (
            <span className="pointer-events-none absolute left-3 z-10 text-[var(--text-muted)] [&_svg]:size-4">
              {startContent}
            </span>
          )}
          <InputRoot
            placeholder={placeholder}
            type={type}
            className={cn(
              "h-10 w-full rounded-2xl border bg-[var(--glass-bg)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors",
              "border-[var(--glass-border)] backdrop-blur-[var(--glass-blur)]",
              "placeholder:text-[var(--text-muted)]",
              "focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30",
              "disabled:cursor-not-allowed disabled:opacity-50",
              startContent && "pl-9",
              endContent && "pr-9",
              error && "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/30",
              inputClassName
            )}
          />
          {endContent && (
            <span className="absolute right-3 z-10 text-[var(--text-muted)] [&_svg]:size-4">
              {endContent}
            </span>
          )}
        </div>
        {error && (
          <FieldError className="text-xs text-[var(--danger)]">
            {error}
          </FieldError>
        )}
        {hint && !error && (
          <Description className="text-xs text-[var(--text-muted)]">
            {hint}
          </Description>
        )}
      </TextField>
    )
  }
)
Input.displayName = "Input"

export { Input }
