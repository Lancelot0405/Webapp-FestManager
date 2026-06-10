import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Dialog (Portal wrapper) ───────────────────────────────────────────────
interface DialogProps {
  open?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const Dialog = ({ open, isOpen, onOpenChange, children }: DialogProps) => {
  const resolved = isOpen ?? open ?? false
  if (!resolved) return null
  return (
    <DialogPortalInner onOpenChange={onOpenChange}>
      {children}
    </DialogPortalInner>
  )
}
Dialog.displayName = "Dialog"

// Internal portal wrapper — renders in document.body
interface PortalProps {
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}
const DialogPortalInner = ({ onOpenChange, children }: PortalProps) => {
  // Lock body scroll while open
  React.useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const handleBackdropClick = () => onOpenChange?.(false)

  return createPortal(
    <DialogPortalContext.Provider value={{ onOpenChange }}>
      <div
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
        aria-modal="true"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
        {/* Content slot — rendered by DialogContent */}
        {children}
      </div>
    </DialogPortalContext.Provider>,
    document.body
  )
}

const DialogPortalContext = React.createContext<{
  onOpenChange?: (open: boolean) => void
}>({})

// ── DialogContent ─────────────────────────────────────────────────────────
interface DialogContentProps {
  position?: "center" | "bottom"
  className?: string
  children?: React.ReactNode
  hideClose?: boolean
}

const DialogContent = ({ position = "center", className, children, hideClose = false }: DialogContentProps) => {
  const { onOpenChange } = React.useContext(DialogPortalContext)
  return (
    <div
      className={cn(
        "relative z-10 bg-white dark:bg-[var(--card-bg)] shadow-xl outline-none",
        position === "bottom"
          ? "w-full max-w-full rounded-t-2xl rounded-b-none self-end"
          : "w-full max-w-lg rounded-xl mx-4",
        className
      )}
      onClick={e => e.stopPropagation()}
    >
      {!hideClose && (
        <button
          type="button"
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity focus:outline-none z-10 text-[var(--text-muted)]"
          aria-label="Đóng"
        >
          <X className="size-4" />
        </button>
      )}
      {children}
    </div>
  )
}
DialogContent.displayName = "DialogContent"

// ── Sub-components ────────────────────────────────────────────────────────
const DialogHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6 pb-0", className)} {...props}>
    {children}
  </div>
)
DialogHeader.displayName = "DialogHeader"

const DialogBody = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("py-4 px-6", className)} {...props}>
    {children}
  </div>
)
DialogBody.displayName = "DialogBody"

const DialogFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse gap-2 p-6 pt-0 sm:flex-row sm:justify-end", className)} {...props}>
    {children}
  </div>
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight text-[var(--text-primary)]", className)} {...props}>
      {children}
    </h2>
  )
)
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-[var(--text-muted)]", className)} {...props}>
      {children}
    </p>
  )
)
DialogDescription.displayName = "DialogDescription"

const DialogTrigger = ({ children }: { children?: React.ReactNode }) => <>{children}</>
const DialogPortal   = ({ children }: { children?: React.ReactNode }) => <>{children}</>
const DialogOverlay  = () => null
const DialogClose    = ({ children }: { children?: React.ReactNode }) => <>{children}</>

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
