'use client';

import { Button } from "@nextui-org/react";
import { Menu, Terminal } from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleLogger: () => void;
}

export function Header({ onToggleSidebar, onToggleLogger }: HeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        <Button
          isIconOnly
          variant="light"
          className="lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex-1" />
        
        <Button
          isIconOnly
          variant="light"
          onClick={onToggleLogger}
          className="hidden lg:flex"
        >
          <Terminal className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
} 