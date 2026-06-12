import * as React from "react"
import { X } from "lucide-react"
import { Button } from "@heroui/react"
import { cn } from "@/lib/utils"
import {
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  DrawerRoot,
  DrawerBackdrop,
  DrawerContent as DrawerContentHeroUI,
  DrawerDialog,
} from "@heroui/react"

// ── Context ───────────────────────────────────────────────────────────────
const DialogContext = React.createContext<{
  onOpenChange?: (open: boolean) => void
}>({})

// ── Dialog ────────────────────────────────────────────────────────────────
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
    <DialogContext.Provider value={{ onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}
Dialog.displayName = "Dialog"

// ── DialogContent ─────────────────────────────────────────────────────────
interface DialogContentProps {
  position?: "center" | "bottom"
  className?: string
  children?: React.ReactNode
  hideClose?: boolean
}

const DialogContent = ({
  position = "center",
  className,
  children,
  hideClose = false,
}: DialogContentProps) => {
  const { onOpenChange } = React.useContext(DialogContext)

  const closeBtn = !hideClose && (
    <Button
      isIconOnly
      variant="ghost"
      onPress={() => onOpenChange?.(false)}
      className="absolute right-4 top-4 z-10 h-auto min-w-0 rounded-full p-1.5 text-[var(--text-muted)] opacity-60 transition-opacity hover:bg-white/10 hover:opacity-100 focus:outline-none"
      aria-label="Đóng"
    >
      <X className="size-4" />
    </Button>
  )

  if (position === "bottom") {
    return (
      <DrawerRoot isOpen onOpenChange={onOpenChange}>
        <DrawerBackdrop
          isDismissable
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        >
          <DrawerContentHeroUI
            placement="bottom"
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[201] max-h-[95dvh] rounded-t-2xl outline-none",
              "border-x border-t border-[var(--glass-border)] bg-[var(--popover)] backdrop-blur-[var(--glass-blur)]",
              "shadow-2xl",
              className
            )}
          >
            <DrawerDialog aria-label="dialog" className="relative outline-none">
              {closeBtn}
              {children}
            </DrawerDialog>
          </DrawerContentHeroUI>
        </DrawerBackdrop>
      </DrawerRoot>
    )
  }

  return (
    <ModalRoot isOpen onOpenChange={onOpenChange}>
      <ModalBackdrop
        isDismissable
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      >
        <ModalContainer
          className={cn(
            "relative z-[201] w-full max-w-lg rounded-xl outline-none",
            "border border-[var(--glass-border)] bg-[var(--popover)] backdrop-blur-[var(--glass-blur)]",
            "shadow-2xl",
            className
          )}
        >
          <ModalDialog aria-label="dialog" className="relative outline-none">
            {closeBtn}
            {children}
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  )
}
DialogContent.displayName = "DialogContent"

// ── Sub-components ────────────────────────────────────────────────────────
const DialogHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 p-6 pb-0", className)}
    {...props}
  >
    {children}
  </div>
)
DialogHeader.displayName = "DialogHeader"

const DialogBody = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-6 py-4", className)} {...props}>
    {children}
  </div>
)
DialogBody.displayName = "DialogBody"

const DialogFooter = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 p-6 pt-0 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  >
    {children}
  </div>
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-[var(--text-primary)]",
      className
    )}
    {...props}
  >
    {children}
  </h2>
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--text-muted)]", className)}
    {...props}
  >
    {children}
  </p>
))
DialogDescription.displayName = "DialogDescription"

const DialogTrigger = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)
const DialogPortal = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)
const DialogOverlay = () => null
const DialogClose = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)

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
