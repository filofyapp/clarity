import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium font-outfit uppercase tracking-wider whitespace-nowrap transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-brand-primary/20 text-brand-primary border-brand-primary/30",
        secondary: "bg-brand-secondary/20 text-brand-secondary border-brand-secondary/30",
        destructive: "bg-color-danger-soft text-color-danger border-color-danger/30",
        success: "bg-color-success-soft text-color-success border-color-success/30",
        warning: "bg-color-warning-soft text-color-warning border-color-warning/30",
        outline: "border-border-default text-text-secondary hover:bg-bg-surface hover:text-text-primary",
        ghost: "hover:bg-bg-surface hover:text-text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
