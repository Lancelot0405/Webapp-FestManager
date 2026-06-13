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
          <Label className="text-xs font-medium text-foreground/80">
            {label}
          </Label>
        )}
        <TextAreaRoot
          ref={ref}
          placeholder={placeholder}
          rows={minRows}
          style={maxRows ? { maxHeight: `${maxRows * 1.5}rem` } : undefined}
          className={cn(
            "w-full resize-y rounded-2xl border bg-default/50 px-3 py-2 text-sm text-foreground transition-colors",
            "border-separator backdrop-blur-xl",
            "placeholder:text-muted",
            "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger focus:border-danger focus:ring-danger/30",
            textareaClassName
          )}
        />
        {error && (
          <FieldError className="text-xs text-danger">
            {error}
          </FieldError>
        )}
        {hint && !error && (
          <Description className="text-xs text-muted">
            {hint}
          </Description>
        )}
      </TextField>
    )
  }
)
Textarea.displayName = "GlassTextarea"

export { Textarea }
