"use client"

import { useState, useEffect } from "react"
import { TorrentProvider } from "@/lib/torrent-store"
import { Toolbar } from "@/components/toolbar"
import { ResizableDetailLayout } from "@/components/resizable-detail-layout"
import { StatusBar } from "@/components/status-bar"
import { ApiErrorBanner } from "@/components/api-error-banner"
import { useThemeAuto } from "@/components/theme-toggle"
import { login } from "@/lib/api"

async function checkLoggedIn(): Promise<boolean> {
  try {
    const res = await fetch("/api/v2/torrents/info", {
      credentials: "same-origin",
      headers: { Referer: window.location.origin },
    })
    if (!res.ok) return false
    const data = await res.json()
    return Array.isArray(data)
  } catch {
    return false
  }
}

function LoadingScreen() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-card">
      <span className="text-sm text-muted-foreground">...</span>
    </div>
  )
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const ok = await login(username, password)
      if (ok) {
        ;(window as any).__qbt_just_logged_in = true
        setTimeout(() => {
          ;(window as any).__qbt_just_logged_in = false
        }, 6000)
        await new Promise((r) => setTimeout(r, 150))
        window.dispatchEvent(new CustomEvent("qbt-login-success"))
        onSuccess()
      } else {
        setError("Invalid username or password")
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      if (errMsg.includes("banned")) {
        setError("Too many failed login attempts. IP temporarily banned.")
      } else {
        setError("Cannot connect to qBittorrent. Check if qBittorrent-nox is running.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center bg-card px-3 py-4 sm:px-4 sm:py-6">
      <form
        onSubmit={handleSubmit}
        className="login-form flex w-full max-w-md flex-col items-stretch gap-3 sm:gap-0"
      >
        <div className="login-bar flex w-full flex-col overflow-hidden sm:flex-row sm:items-center">
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="login-bar-input w-full flex-1 min-w-0 text-base sm:text-sm"
            autoComplete="username"
            aria-label="Username"
          />
          <div className="login-bar-divider hidden sm:block" aria-hidden="true" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="login-bar-input w-full flex-1 min-w-0 text-base sm:text-sm"
            autoComplete="current-password"
            aria-label="Password"
          />
          <div className="login-bar-divider hidden sm:block" aria-hidden="true" />
          <button
            type="submit"
            disabled={isSubmitting}
            className="login-bar-btn flex items-center justify-center w-full shrink-0 px-5 py-3 text-base sm:w-auto sm:py-0 sm:text-sm sm:px-4"
            aria-label="Sign in"
          >
            {isSubmitting ? (
              "..."
            ) : (
              <img src="/icons/login/login.svg" alt="" className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        <div className="min-h-[1.25rem] w-full text-center text-sm text-destructive" role="alert">
          {error}
        </div>
      </form>
    </div>
  )
}

function AppLayout() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <ApiErrorBanner />
      <div className="flex min-h-0 flex-1 min-w-0 flex-col px-3">
        <header className="flex min-w-0 shrink-0 items-center bg-card pb-6 pt-3">
          <Toolbar onMenuClick={undefined} />
        </header>
        <main className="flex flex-1 flex-col min-h-0">
          <ResizableDetailLayout />
        </main>
      </div>
      <StatusBar />
    </div>
  )
}

export default function App() {
  useThemeAuto()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    checkLoggedIn().then(setAuthed)
  }, [])

  // Three distinct render branches - no shared component with changing hook count
  if (authed === null) {
    return <LoadingScreen />
  }
  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />
  }
  return (
    <TorrentProvider>
      <AppLayout />
    </TorrentProvider>
  )
}
