import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme
    if (stored) {
      setTheme(stored)
      updateTheme(stored)
    }
  }, [])

  const updateTheme = (newTheme: Theme) => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(newTheme)
    }
  }

  const setThemeAndStore = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    updateTheme(newTheme)
  }

  return { theme, setTheme: setThemeAndStore }
} 