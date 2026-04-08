import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const fieldSetVariants = cva("grid gap-6")

const FieldSet = React.forwardRef<
  HTMLFieldSetElement,
  React.FieldsetHTMLAttributes<HTMLFieldSetElement>
>(({ className, ...props }, ref) => (
  <fieldset ref={ref} className={cn(fieldSetVariants(), className)} {...props} />
))
FieldSet.displayName = "FieldSet"

const fieldLegendVariants = cva(
  "text-sm font-medium leading-none tracking-tight"
)

const FieldLegend = React.forwardRef<
  HTMLLegendElement,
  React.ComponentPropsWithoutRef<"legend"> &
    VariantProps<typeof fieldLegendVariants> & {
      variant?: "default" | "label"
    }
>(({ className, variant = "default", ...props }, ref) => (
  <legend
    ref={ref}
    className={cn(
      fieldLegendVariants(),
      variant === "label" && "text-sm font-medium leading-none",
      className
    )}
    {...props}
  />
))
FieldLegend.displayName = "FieldLegend"

const FieldGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("grid gap-6", className)} {...props} />
))
FieldGroup.displayName = "FieldGroup"

const fieldVariants = cva("grid gap-2")

const Field = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "vertical" | "horizontal" | "responsive"
    "data-invalid"?: boolean
  }
>(({ className, orientation = "vertical", "data-invalid": dataInvalid, ...props }, ref) => (
  <div
    ref={ref}
    data-invalid={dataInvalid}
    className={cn(
      fieldVariants(),
      orientation === "horizontal" &&
        "flex-row items-center gap-4 [&>label]:w-[200px] [&>label]:text-right",
      orientation === "responsive" &&
        "@container/field-group grid-cols-1 @[550px]/field-group:grid-cols-[180px_1fr] @[550px]/field-group:gap-4 @[550px]/field-group:items-center [&>label]:@[550px]/field-group:text-right",
      dataInvalid && "[&>input]:border-destructive [&>textarea]:border-destructive [&>select]:border-destructive",
      className
    )}
    {...props}
  />
))
Field.displayName = "Field"

const FieldContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("grid gap-1.5", className)} {...props} />
))
FieldContent.displayName = "FieldContent"

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    asChild?: boolean
  }
>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : LabelPrimitive.Root
  return (
    <Comp
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
})
FieldLabel.displayName = "FieldLabel"

const FieldTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-medium leading-none", className)}
    {...props}
  />
))
FieldTitle.displayName = "FieldTitle"

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
FieldDescription.displayName = "FieldDescription"

const FieldSeparator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>(({ className, children, ...props }, ref) => (
  <div className={cn("relative flex items-center gap-4", className)}>
    <hr ref={ref} className="flex-1 border-border" {...props} />
    {children && (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {children}
      </span>
    )}
  </div>
))
FieldSeparator.displayName = "FieldSeparator"

interface FieldErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  errors?: Array<{ message?: string } | undefined>
}

const FieldError = React.forwardRef<HTMLDivElement, FieldErrorProps>(
  ({ className, errors, children, ...props }, ref) => {
    const errorMessages = errors?.filter(Boolean).map((error) => error?.message) || []
    const hasErrors = errorMessages.length > 0 || children

    if (!hasErrors) return null

    return (
      <div
        ref={ref}
        role="alert"
        className={cn("text-sm font-medium text-destructive", className)}
        {...props}
      >
        {errorMessages.length > 0 ? (
          <ul className="list-disc list-inside space-y-1">
            {errorMessages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        ) : (
          children
        )}
      </div>
    )
  }
)
FieldError.displayName = "FieldError"

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
}
