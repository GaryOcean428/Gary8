import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary-foreground border border-primary/20",
        secondary: "bg-secondary/10 text-secondary-foreground border border-secondary/20",
        destructive: "bg-destructive/10 text-destructive-foreground border border-destructive/20",
        outline: "bg-transparent border border-input text-foreground",
        success: "bg-success/10 text-success-foreground border border-success/20",
        warning: "bg-warning/10 text-warning-foreground border border-warning/20"
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        glow: "shadow-[0_0_10px_rgba(var(--badge-glow-color,var(--primary-rgb)),0.5)]",
      }
    },
    defaultVariants: {
      variant: "default",
      animation: "none"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({ className, variant, animation, icon, children, ...props }: BadgeProps) {
  return (
    <div className={badgeVariants({ variant, animation, className })} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };