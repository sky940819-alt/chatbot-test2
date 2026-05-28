import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAppStore } from '@/store'

interface ThemeCtx {
  isDark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeCtx>({ isDark: false, toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useAppStore()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark =
      settings.theme === 'dark' || (settings.theme === 'system' && prefersDark)
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [settings.theme])

  const toggle = () => {
    const next = isDark ? 'light' : 'dark'
    updateSettings({ theme: next })
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
