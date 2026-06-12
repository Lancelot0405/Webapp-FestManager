import type { ReactNode } from "react"
import { Button } from "@heroui/react"
import { cn } from "@/lib/utils"

interface FabProps {
  onPress: () => void
  label: string
  icon: ReactNode
  className?: string
}

/**
 * Floating Action Button — chỉ hiển thị trên mobile (md:hidden),
 * nổi góc dưới phải, phía trên thanh BottomNav.
 */
export function Fab({ onPress, label, icon, className }: FabProps) {
  return (
    <Button
      onPress={onPress}
      isIconOnly
      aria-label={label}
      className={cn(
        "md:hidden fixed bottom-24 right-4 z-30 h-14 w-14 rounded-full",
        "bg-[var(--primary)] text-[var(--background)] shadow-[var(--shadow-hero)]",
        "active:scale-95 transition-transform",
        className
      )}
    >
      {icon}
    </Button>
  )
}
