import * as React from "react"
import {
  Select as HeroSelect,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIndicator,
  SelectPopover,
  ListBox,
  ListBoxItem,
} from "@heroui/react"
import { cn } from "@/lib/utils"

// ── SelectItem ────────────────────────────────────────────────────────────
export interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

const SelectItem = ({ value, children, className, disabled }: SelectItemProps) => (
  <ListBoxItem
    id={value}
    textValue={typeof children === "string" ? children : value}
    isDisabled={disabled}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-2 text-sm outline-none",
      "data-[focused]:bg-[var(--accent)] data-[focused]:text-[var(--accent-fg)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
  >
    {children}
  </ListBoxItem>
)
SelectItem.displayName = "SelectItem"

// ── Select ────────────────────────────────────────────────────────────────
export interface SelectProps {
  label?: string
  placeholder?: string
  error?: string
  className?: string
  triggerClassName?: string
  children: React.ReactNode
  // RAC / controlled
  selectedKey?: string | null
  defaultSelectedKey?: string
  onSelectionChange?: (key: string) => void
  isDisabled?: boolean
  isRequired?: boolean
  name?: string
  fullWidth?: boolean
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({
    label,
    placeholder = "Select an option",
    error,
    className,
    triggerClassName,
    children,
    selectedKey,
    defaultSelectedKey,
    onSelectionChange,
    isDisabled,
    isRequired,
    name,
    fullWidth = true,
  }, ref) => {
    const id = React.useId()

    return (
      <div className={cn("flex flex-col gap-1 w-full", className)}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[var(--text-primary)]">
            {label}
          </label>
        )}
        <SelectRoot
          selectedKey={selectedKey}
          defaultSelectedKey={defaultSelectedKey}
          onSelectionChange={key => onSelectionChange?.(key as string)}
          isDisabled={isDisabled}
          isRequired={isRequired}
          name={name}
          fullWidth={fullWidth}
          aria-label={label ?? placeholder}
          aria-invalid={!!error}
        >
          <SelectTrigger
            ref={ref}
            id={id}
            className={cn(
              "h-9 w-full rounded-md border border-[var(--border-color)] bg-transparent px-3 py-1",
              "text-sm text-[var(--text-primary)] shadow-sm transition-colors",
              "focus:outline-none focus:ring-1 focus:ring-[var(--ring)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "dark:bg-[var(--card-bg)]",
              error && "border-[var(--destructive)] focus:ring-[var(--destructive)]",
              triggerClassName
            )}
          >
            <SelectValue className="flex-1 text-left data-[placeholder]:text-[var(--text-muted)]">
              {({ selectedText }) => selectedText ?? <span className="text-[var(--text-muted)]">{placeholder}</span>}
            </SelectValue>
            <SelectIndicator className="ml-2 shrink-0 opacity-50" />
          </SelectTrigger>
          <SelectPopover className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] shadow-md">
            <ListBox className="p-1">
              {children}
            </ListBox>
          </SelectPopover>
        </SelectRoot>
        {error && (
          <p className="text-xs text-[var(--destructive)]">{error}</p>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

// Native <select> wrapper for simpler use cases (unchanged API with className)
export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  wrapperClassName?: string
}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ label, error, wrapperClassName, className, id, children, ...props }, ref) => {
    const genId = React.useId()
    const selectId = id ?? genId

    return (
      <div className={cn("flex flex-col gap-1 w-full", wrapperClassName)}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-[var(--text-primary)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-9 w-full rounded-md border border-[var(--border-color)] bg-transparent px-3 py-1",
            "text-sm text-[var(--text-primary)] shadow-sm transition-colors",
            "focus:outline-none focus:ring-1 focus:ring-[var(--ring)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-[var(--card-bg)]",
            error && "border-[var(--destructive)]",
            className
          )}
          aria-invalid={!!error}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
      </div>
    )
  }
)
NativeSelect.displayName = "NativeSelect"

export { Select, SelectItem, NativeSelect }
export { HeroSelect, SelectRoot, SelectTrigger, SelectValue, SelectIndicator, SelectPopover }
