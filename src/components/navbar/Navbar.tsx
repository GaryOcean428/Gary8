import React from 'react';
import { Brain, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="bg-card/50 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Brain className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold">Agent One</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/animation">Animation</NavLink>
              <NavLink to="/canvas">Canvas</NavLink>
              <NavLink to="/tools">Tools</NavLink>
            </div>
          </div>
          
          <div className="hidden sm:flex sm:items-center sm:space-x-3">
            <Button variant="ghost" size="sm">Sign In</Button>
            <Button variant="default" size="sm">Sign Up</Button>
          </div>
          
          <div className="flex items-center sm:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-expanded={isOpen}
            >
              <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="sm:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="pt-2 pb-4 space-y-1 px-4">
              <MobileNavLink to="/" onClick={() => setIsOpen(false)}>
                Home
              </MobileNavLink>
              <MobileNavLink to="/animation" onClick={() => setIsOpen(false)}>
                Animation
              </MobileNavLink>
              <MobileNavLink to="/canvas" onClick={() => setIsOpen(false)}>
                Canvas
              </MobileNavLink>
              <MobileNavLink to="/tools" onClick={() => setIsOpen(false)}>
                Tools
              </MobileNavLink>
            </div>
            <div className="border-t border-border pt-4 pb-3">
              <div className="space-y-1 px-4">
                <button className="w-full text-left block px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
                  Sign In
                </button>
                <button className="w-full text-left block px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-md">
                  Sign Up
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const isActive = window.location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full ${
        isActive
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ 
  to, 
  children, 
  onClick 
}: { 
  to: string; 
  children: React.ReactNode; 
  onClick?: () => void;
}) {
  const isActive = window.location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded-md text-base font-medium ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}