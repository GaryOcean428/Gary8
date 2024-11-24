import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '../../lib/utils';

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  className?: string;
  children: React.ReactNode;
}

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        className="flex select-none touch-none p-0.5 bg-secondary/50 transition-colors hover:bg-secondary/80"
        orientation="vertical"
      >
        <ScrollAreaPrimitive.Thumb className="flex-1 bg-foreground/20 rounded-full relative" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}