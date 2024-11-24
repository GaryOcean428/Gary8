import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../providers/ThemeProvider';

export function ThemeSettings() {
  const { isDarkMode, toggleTheme, theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium gradient-text">Theme Settings</h3>
          <p className="text-sm text-muted-foreground">
            Customize the appearance of the application
          </p>
        </div>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
          <img 
            src="/gary8-logo.svg" 
            alt="Gary8 Logo" 
            className="relative w-12 h-12 logo-glow"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Theme Mode</h4>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-3 rounded-lg bg-background hover:glass glass-hover transition-all duration-200"
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-primary" />
              ) : (
                <Moon className="w-5 h-5 text-primary" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Theme Colors</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="card p-4">
                <span className="text-sm font-medium">Background</span>
                <div className="mt-2 h-8 rounded-md" style={{ background: theme.background }}></div>
              </div>
              <div className="card p-4">
                <span className="text-sm font-medium">Primary</span>
                <div className="mt-2 h-8 rounded-md" style={{ background: theme.primary }}></div>
              </div>
              <div className="card p-4">
                <span className="text-sm font-medium">Secondary</span>
                <div className="mt-2 h-8 rounded-md" style={{ background: theme.secondary }}></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="card p-4">
                <span className="text-sm font-medium">Accent</span>
                <div className="mt-2 h-8 rounded-md" style={{ background: theme.accent }}></div>
              </div>
              <div className="card p-4">
                <span className="text-sm font-medium">Border</span>
                <div className="mt-2 h-8 rounded-md" style={{ background: theme.border }}></div>
              </div>
              <div className="card p-4">
                <span className="text-sm font-medium">Muted</span>
                <div className="mt-2 h-8 rounded-md" style={{ background: theme.muted }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h4 className="text-sm font-medium mb-3">Preview</h4>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button className="btn btn-primary">Primary Button</button>
              <button className="btn btn-secondary">Secondary Button</button>
            </div>
            <input 
              type="text" 
              className="input w-full" 
              placeholder="Input field"
            />
            <div className="bg-code-background text-code-text p-3 rounded-lg text-sm font-mono">
              <span style={{ color: theme.code.keyword }}>const</span>{' '}
              <span style={{ color: theme.code.function }}>greeting</span>{' '}
              <span style={{ color: theme.code.text }}>= </span>
              <span style={{ color: theme.code.string }}>"Hello Gary8!"</span>
              <span style={{ color: theme.code.comment }}> // Code preview</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
