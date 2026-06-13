import {
  Select as SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPopover,
  ListBox,
  ListBoxItem,
  Label,
  FieldError,
} from "@heroui/react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  size?: "sm" | "md"
  className?: string
  isDisabled?: boolean
  error?: string
}

const Select = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  required,
  size = "md",
  className,
  isDisabled,
  error,
}: SelectProps) => {
  return (
    <SelectRoot
      selectedKey={value || null}
      onSelectionChange={(key) => onChange(key != null ? String(key) : "")}
      isRequired={required}
      isDisabled={isDisabled}
      isInvalid={!!error}
      placeholder={placeholder}
      className={cn("flex w-full flex-col gap-1", className)}
    >
      {label && (
        <Label className="text-xs font-medium text-foreground/80">
          {label}
        </Label>
      )}
      <SelectTrigger
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-2xl border bg-default/50 px-3 text-left text-foreground transition-colors",
          "border-separator backdrop-blur-xl",
          "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30",
          "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
          size === "sm" ? "h-9 text-xs" : "h-10 text-sm",
          error && "border-danger focus:border-danger focus:ring-danger/30",
        )}
      >
        <SelectValue className="truncate data-[placeholder]:text-muted" />
        <ChevronDown className="size-4 shrink-0 text-muted" />
      </SelectTrigger>
      <SelectPopover
        className={cn(
          "z-[300] max-h-60 w-[var(--trigger-width)] overflow-auto rounded-2xl border p-1 shadow-xl",
          "border-separator bg-overlay backdrop-blur-xl"
        )}
      >
        <ListBox className="outline-none">
          {options.map((opt) => (
            <ListBoxItem
              key={opt.value}
              id={opt.value}
              textValue={opt.label}
              className={cn(
                "flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm text-foreground outline-none transition-colors",
                "data-[hovered]:bg-accent/10 data-[focused]:bg-accent/10",
                "data-[selected]:bg-accent/15 data-[selected]:text-accent data-[selected]:font-medium"
              )}
            >
              {opt.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </SelectPopover>
      {error && (
        <FieldError className="text-xs text-danger">{error}</FieldError>
      )}
    </SelectRoot>
  )
}
Select.displayName = "GlassSelect"

export { Select }
