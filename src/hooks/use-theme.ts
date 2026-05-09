"use client"

import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'amoled'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('skillup-theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
      applyTheme('dark')
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark', 'amoled')
    root.classList.add(newTheme)
    localStorage.setItem('skillup-theme', newTheme)
  }

  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  return { theme, toggleTheme }
}