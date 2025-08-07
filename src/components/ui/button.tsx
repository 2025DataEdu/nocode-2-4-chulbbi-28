import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles with enhanced accessibility and Material Design principles
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        // Primary - inspired by Material Design
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md active:scale-[0.98] transform-gpu",
        
        // Destructive - enhanced with better feedback
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md active:scale-[0.98] transform-gpu",
        
        // Outline - improved contrast and states
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent active:scale-[0.98] transform-gpu",
        
        // Secondary - refined with better hierarchy
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary-hover hover:shadow-md active:scale-[0.98] transform-gpu",
        
        // Ghost - enhanced hover states
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80 active:scale-[0.98] transform-gpu",
        
        // Link - improved accessibility
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-hover focus-visible:underline",
        
        // Gradient variants - big tech inspired
        gradient: "bg-gradient-primary text-primary-foreground shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transform-gpu",
        
        // Success state
        success: "bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow-md active:scale-[0.98] transform-gpu",
        
        // Warning state  
        warning: "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 hover:shadow-md active:scale-[0.98] transform-gpu",
        
        // Floating Action Button - Material Design inspired
        fab: "bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.05] active:scale-[0.95] rounded-full transform-gpu",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
        fab: "h-14 w-14 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
        <span className={cn(loading && "invisible")}>{children}</span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
