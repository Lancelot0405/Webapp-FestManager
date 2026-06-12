import * as React from "react"
import {
  TextField,
  Label,
  TextArea as TextAreaRoot,
  FieldError,
  Description,
  type TextFieldRootProps,
} from "@heroui/react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends Omit<TextFieldRootProps, "children"> {
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  minRows?: number
  maxRows?: number
  className?: string
  textareaClassName?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    label,
    error,
    hint,
    placeholder,
    minRows = 2,
    maxRows,
    className,
    textareaClassName,
    ...props
  }, ref) => {
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
        <TextAreaRoot
          ref={ref}
          placeholder={placeholder}
          rows={minRows}
          style={maxRows ? { maxHeight: `${maxRows * 1.5}rem` } : undefined}
          className={cn(
            "w-full resize-y rounded-2xl border bg-[var(--glass-bg)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors",
            "border-[var(--glass-border)] backdrop-blur-[var(--glass-blur)]",
            "placeholder:text-[var(--text-muted)]",
            "focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/30",
            textareaClassName
          )}
        />
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
Textarea.displayName = "Textarea"

export { Textarea }
