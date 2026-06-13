import {
  Select as SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPopover,
  ListBox,
  ListBoxItem,
  Label,
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
}: SelectProps) => {
  return (
    <SelectRoot
      selectedKey={value || null}
      onSelectionChange={(key) => onChange(key != null ? String(key) : "")}
      isRequired={required}
      isDisabled={isDisabled}
      placeholder={placeholder}
      className={cn("flex w-full flex-col gap-1", className)}
    >
      {label && (
        <Label className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </Label>
      )}
      <SelectTrigger
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-2xl border bg-[var(--glass-bg)] px-3 text-left text-[var(--text-primary)] transition-colors",
          "border-[var(--glass-border)] backdrop-blur-[var(--glass-blur)]",
          "focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30",
          "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
          size === "sm" ? "h-9 text-xs" : "h-10 text-sm"
        )}
      >
        <SelectValue className="truncate data-[placeholder]:text-[var(--text-muted)]" />
        <ChevronDown className="size-4 shrink-0 text-[var(--text-muted)]" />
      </SelectTrigger>
      <SelectPopover
        className={cn(
          "z-[300] max-h-60 w-[var(--trigger-width)] overflow-auto rounded-2xl border p-1 shadow-xl",
          "border-[var(--glass-border)] bg-[var(--popover)] backdrop-blur-[var(--glass-blur)]"
        )}
      >
        <ListBox className="outline-none">
          {options.map((opt) => (
            <ListBoxItem
              key={opt.value}
              id={opt.value}
              textValue={opt.label}
              className={cn(
                "flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors",
                "data-[hovered]:bg-[var(--primary)]/10 data-[focused]:bg-[var(--primary)]/10",
                "data-[selected]:bg-[var(--primary)]/15 data-[selected]:text-[var(--primary)] data-[selected]:font-medium"
              )}
            >
              {opt.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </SelectPopover>
    </SelectRoot>
  )
}
Select.displayName = "GlassSelect"

export { Select }
