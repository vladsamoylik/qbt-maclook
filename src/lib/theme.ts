/**
 * Client-side theme (light/dark/system) persisted in localStorage.
 * Not sent to qBittorrent API.
 */

const STORAGE_KEY = "qbt-maclook"
export type ThemeMode = "light" | "dark" | "system"

const THEME_COLORS = { light: "#f2f2f2", dark: "#08090c" } as const

export function applyTheme(mode?: ThemeMode) {
  const effective = mode ?? (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? "system"
  const dark = effective === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : effective === "dark"
  document.documentElement.classList.toggle("dark", dark)
  const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
  if (meta) meta.content = dark ? THEME_COLORS.dark : THEME_COLORS.light
}

export function getStoredTheme(): ThemeMode {
  const v = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  return v === "light" || v === "dark" || v === "system" ? v : "system"
}

export function setStoredTheme(mode: ThemeMode) {
  localStorage.setItem(STORAGE_KEY, mode)
  applyTheme(mode)
}
