import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeName = 'green' | 'dark' | 'beige-green' | 'beige-sky' | 'beige-brown' | 'beige-blue'

export const THEMES: { name: ThemeName; label: string; swatch: string }[] = [
  { name: 'green',       label: '기본 초록',   swatch: '#2E5A3A' },
  { name: 'dark',        label: '흰검',        swatch: '#2A2A28' },
  { name: 'beige-green', label: '베이지+초록', swatch: '#3D7A50' },
  { name: 'beige-sky',   label: '베이지+하늘', swatch: '#3A7CA5' },
  { name: 'beige-brown', label: '베이지+갈색', swatch: '#7B5C3E' },
  { name: 'beige-blue',  label: '베이지+파랑', swatch: '#4A6FA5' },
]

interface ThemeCtx {
  theme: ThemeName
  setTheme: (t: ThemeName) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeCtx>({ theme: 'green', setTheme: () => {}, isDark: false })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('milrim-theme') as ThemeName | null
    return saved || 'green'
  })

  const setTheme = (t: ThemeName) => {
    setThemeState(t)
    localStorage.setItem('milrim-theme', t)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
