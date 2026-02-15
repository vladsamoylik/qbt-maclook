"use client"

import { useEffect } from "react"
import { applyTheme, getStoredTheme } from "@/lib/theme"

/**
 * Hook that applies stored theme and listens for system preference changes when mode is "system".
 * Call once at app root (e.g. in App.tsx).
 */
export function useThemeAuto() {
  useEffect(() => {
    applyTheme()
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      if (getStoredTheme() === "system") applyTheme()
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
}
