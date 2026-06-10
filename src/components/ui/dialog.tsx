import * as React from "react"
import { Modal, useOverlayState } from "@heroui/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Dialog (Modal wrapper) ────────────────────────────────────────────────
interface DialogProps {
  open?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const Dialog = ({ open, isOpen, onOpenChange, children }: DialogProps) => {
  const resolved = isOpen ?? open ?? false
  const state = useOverlayState({ isOpen: resolved, onOpenChange })

  return (
    <Modal.Root state={state}>
      {children}
    </Modal.Root>
  )
}
Dialog.displayName = "Dialog"

// ── DialogContent ─────────────────────────────────────────────────────────
interface DialogContentProps {
  position?: "center" | "bottom"
  scrollBehavior?: "inside" | "outside"
  className?: string
  children?: React.ReactNode
}

const DialogContent = ({ position = "center", className, children }: DialogContentProps) => {
  return (
    <>
      <Modal.Backdrop isDismissable />
      <Modal.Container
        placement={position === "bottom" ? "bottom" : "center"}
        className={cn(
          position === "bottom"
            ? "w-full max-w-full rounded-t-2xl rounded-b-none"
            : "w-full max-w-lg rounded-xl",
          className
        )}
      >
        <Modal.Dialog className="relative outline-none">
          <Modal.CloseTrigger
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
            aria-label="Close"
          >
            <X className="size-4" />
          </Modal.CloseTrigger>
          {children}
        </Modal.Dialog>
      </Modal.Container>
    </>
  )
}
DialogContent.displayName = "DialogContent"

// ── Sub-components ────────────────────────────────────────────────────────
const DialogHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Modal.Header className={cn("flex flex-col space-y-1.5", className)} {...props}>
    {children}
  </Modal.Header>
)
DialogHeader.displayName = "DialogHeader"

const DialogBody = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Modal.Body className={cn("py-4", className)} {...props}>
    {children}
  </Modal.Body>
)
DialogBody.displayName = "DialogBody"

const DialogFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Modal.Footer className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props}>
    {children}
  </Modal.Footer>
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <Modal.Heading ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props}>
      {children}
    </Modal.Heading>
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

// Stub exports for Radix compat
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
