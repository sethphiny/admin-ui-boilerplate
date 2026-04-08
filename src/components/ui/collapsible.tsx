import * as React from "react"
import { HiChevronDown, HiChevronRight } from "react-icons/hi2"
import { cn } from "@/lib/utils"

interface CollapsibleContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | undefined>(undefined)

interface CollapsibleProps {
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps & { open?: boolean; onOpenChange?: (open: boolean) => void }>(
  ({ children, defaultOpen = false, open: controlledOpen, onOpenChange: controlledOnOpenChange, className, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen

    return (
      <CollapsibleContext.Provider value={{ open, onOpenChange: setOpen }}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    )
  }
)
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(CollapsibleContext)
  if (!context) throw new Error("CollapsibleTrigger must be used within Collapsible")

  const { open, onOpenChange } = context

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: () => onOpenChange(!open),
      ref,
    } as any)
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onOpenChange(!open)}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
      {open ? (
        <HiChevronDown className="h-4 w-4 shrink-0" />
      ) : (
        <HiChevronRight className="h-4 w-4 shrink-0" />
      )}
    </button>
  )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(CollapsibleContext)
  if (!context) throw new Error("CollapsibleContent must be used within Collapsible")

  const { open } = context

  if (!open) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden transition-all animate-in slide-in-from-top-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

