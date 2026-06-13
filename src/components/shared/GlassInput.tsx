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
  min?: number | string
  max?: number | string
  step?: number | string
  minLength?: number
  autoFocus?: boolean
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
    min,
    max,
    step,
    minLength,
    autoFocus,
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
        <div className="relative flex items-center">
          {startContent && (
            <span className="pointer-events-none absolute left-3 z-10 text-muted [&_svg]:size-4">
              {startContent}
            </span>
          )}
          <InputRoot
            ref={ref}
            placeholder={placeholder}
            type={type}
            min={min}
            max={max}
            step={step}
            minLength={minLength}
            autoFocus={autoFocus}
            className={cn(
              "h-10 w-full rounded-2xl border bg-default/50 px-3 py-2 text-sm text-foreground transition-colors",
              "border-separator backdrop-blur-xl",
              "placeholder:text-muted",
              "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30",
              "disabled:cursor-not-allowed disabled:opacity-50",
              type === "date" && "[color-scheme:light] dark:[color-scheme:dark]",
              startContent && "pl-9",
              endContent && "pr-9",
              error && "border-danger focus:border-danger focus:ring-danger/30",
              inputClassName
            )}
          />
          {endContent && (
            <span className="absolute right-3 z-10 text-muted [&_svg]:size-4">
              {endContent}
            </span>
          )}
        </div>
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
Input.displayName = "GlassInput"

export { Input }
