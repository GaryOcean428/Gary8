import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Analytics } from '../components/analytics'
import { ThemeProvider } from 'next-themes'

// Optimize font loading
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Ensure text remains visible during webfont load
  variable: '--font-inter',
})

export const metadata = {
  title: 'Gary8 - AI Agent System',
  description: 'Advanced AI agent system for development and automation',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#000' }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <meta name="application-name" content="Gary8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <Analytics />
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
