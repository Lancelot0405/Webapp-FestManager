import * as React from "react"
import {
  Tabs as HeroTabs,
  TabsRoot,
  TabList,
  Tab,
  TabPanel,
} from "@heroui/react"
import { cn } from "@/lib/utils"

// ── Tab item definition ───────────────────────────────────────────────────
export interface TabItem {
  key: string
  label: React.ReactNode
  content?: React.ReactNode
  isDisabled?: boolean
}

// ── Tabs ─────────────────────────────────────────────────────────────────
export interface TabsProps {
  items: TabItem[]
  selectedKey?: string
  defaultSelectedKey?: string
  onSelectionChange?: (key: string) => void
  variant?: "primary" | "secondary"
  orientation?: "horizontal" | "vertical"
  className?: string
  listClassName?: string
  panelClassName?: string
  isDisabled?: boolean
}

const Tabs = ({
  items,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  variant,
  orientation = "horizontal",
  className,
  listClassName,
  panelClassName,
}: TabsProps) => {
  return (
    <TabsRoot
      selectedKey={selectedKey}
      defaultSelectedKey={defaultSelectedKey ?? items[0]?.key}
      onSelectionChange={key => onSelectionChange?.(key as string)}
      orientation={orientation}
      variant={variant}
      className={cn("w-full", className)}
    >
      <TabList className={cn("border-b border-[var(--border-color)]", listClassName)}>
        {items.map(item => (
          <Tab
            key={item.key}
            id={item.key}
            isDisabled={item.isDisabled}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors outline-none cursor-pointer",
              "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              "data-[selected]:text-[var(--primary)] data-[selected]:border-b-2 data-[selected]:border-[var(--primary)]",
              "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
              "focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            )}
          >
            {item.label}
          </Tab>
        ))}
      </TabList>
      {items.map(item => (
        <TabPanel
          key={item.key}
          id={item.key}
          className={cn("outline-none", panelClassName)}
        >
          {item.content}
        </TabPanel>
      ))}
    </TabsRoot>
  )
}
Tabs.displayName = "Tabs"

// ── Compound exports for flexible use ────────────────────────────────────
export { Tabs, HeroTabs, TabsRoot, TabList, Tab, TabPanel }
