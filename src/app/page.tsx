'use client';

import { CanvasTest } from '../components/CanvasTest';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../providers/ThemeProvider';
import { Button, Navbar, NavbarBrand, NavbarContent, NavbarItem, Tooltip, Card } from '@nextui-org/react';
import { tv } from 'tailwind-variants';

// Define reusable styles using tailwind-variants
const styles = tv({
  slots: {
    pageWrapper: 'min-h-screen bg-background transition-colors',
    header: [
      'bg-background/80',
      'backdrop-blur-md',
      'border-b',
      'border-border',
      'sticky',
      'top-0',
      'z-50',
      'supports-[backdrop-filter]:bg-background/60'
    ],
    logoWrapper: [
      'relative',
      'group',
      'hover:opacity-80',
      'transition-opacity',
      'duration-200'
    ],
    logoGlow: [
      'absolute',
      '-inset-1',
      'bg-gradient-to-r',
      'from-primary',
      'to-secondary',
      'rounded-lg',
      'blur',
      'opacity-25',
      'group-hover:opacity-50',
      'transition',
      'duration-200'
    ],
    logo: 'relative w-12 h-12 rounded-lg shadow-lg',
    title: 'bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent',
    mainContent: 'max-w-7xl mx-auto px-6 py-8',
    footer: 'mt-auto py-8 border-t border-border bg-background/80 backdrop-blur-md'
  }
});

export default function Home() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { pageWrapper, header, logoWrapper, logoGlow, logo, title, mainContent, footer } = styles();

  return (
    <div className={pageWrapper()}>
      <Navbar className={header()} maxWidth="xl" isBordered>
        <NavbarBrand>
          <div className={logoWrapper()}>
            <div className={logoGlow()} />
            <img 
              src="/gary8-logo.svg" 
              alt="Gary8 Logo" 
              className={logo()}
            />
          </div>
          <div className="ml-3">
            <h1 className={`text-2xl font-bold ${title()}`}>
              Gary8
            </h1>
            <p className="text-sm text-foreground-500">
              Interactive Canvas
            </p>
          </div>
        </NavbarBrand>
        
        <NavbarContent justify="end">
          <NavbarItem>
            <Tooltip content={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
              <Button
                isIconOnly
                variant="light"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-primary" />
                ) : (
                  <Moon className="w-5 h-5 text-primary" />
                )}
              </Button>
            </Tooltip>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className={mainContent()}>
        <Card className="bg-content1 shadow-medium p-4">
          <CanvasTest />
        </Card>
      </main>

      <footer className={footer()}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-foreground-500">
                Powered by Gary8 AI
              </p>
              <span className="text-primary">•</span>
              <p className="text-sm text-foreground-500 hover:text-primary transition-colors">
                Interactive Canvas Technology
              </p>
            </div>
            <div className={logoWrapper()}>
              <div className={logoGlow()} />
              <img 
                src="/gary8-logo.svg" 
                alt="Gary8 Logo" 
                className="relative w-8 h-8 opacity-50 group-hover:opacity-100 transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
