import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:glow-primary hover:translate-y-[-2px] active:translate-y-0 shadow-md",
        secondary: "bg-secondary text-secondary-foreground hover:glow-secondary hover:translate-y-[-2px] active:translate-y-0 shadow-md",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:glow-destructive hover:translate-y-[-2px] active:translate-y-0 shadow-md",
        success: "bg-success text-success-foreground hover:translate-y-[-2px] active:translate-y-0 shadow-md",
        warning: "bg-warning text-warning-foreground hover:translate-y-[-2px] active:translate-y-0 shadow-md",
        neon: "bg-black text-white shadow-[0_0_20px_2px_var(--neon-color)] border border-[var(--neon-color)] hover:shadow-[0_0_25px_4px_var(--neon-color)]",
        'neon-blue': "bg-black text-[#5eecff] shadow-[0_0_15px_2px_#0091ff] border border-[#5eecff] hover:shadow-[0_0_25px_4px_#0091ff] hover:translate-y-[-2px]",
        'neon-purple': "bg-black text-[#cf8df8] shadow-[0_0_15px_2px_#a020f0] border border-[#cf8df8] hover:shadow-[0_0_25px_4px_#a020f0] hover:translate-y-[-2px]",
        'neon-green': "bg-black text-[#5effb1] shadow-[0_0_15px_2px_#00ff7f] border border-[#5effb1] hover:shadow-[0_0_25px_4px_#00ff7f] hover:translate-y-[-2px]",
        glass: "backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20"
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded",
        sm: "h-8 px-3 rounded-md text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-5 rounded-lg text-base",
        xl: "h-12 px-6 rounded-lg text-lg",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        glow: "animate-glow",
      },
      elevation: {
        none: "",
        low: "elevation-1",
        medium: "elevation-2",
        high: "elevation-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      animation: "none",
      elevation: "none",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, animation, elevation, leftIcon, rightIcon, isLoading, children, ...props }, _ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, animation, elevation, className })}
        ref={_ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };