/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference types="next/navigation-types/navigation" />

// Declare next-themes module
declare module 'next-themes' {
  import { ReactNode } from 'react'
  
  export interface ThemeProviderProps {
    attribute?: string
    defaultTheme?: string
    enableSystem?: boolean
    disableTransitionOnChange?: boolean
    children: ReactNode
    themes?: string[]
  }
  
  export const ThemeProvider: React.FC<ThemeProviderProps>
}

// Declare next/font/google module
declare module 'next/font/google' {
  const Inter: any
  export { Inter }
}
