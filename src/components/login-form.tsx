"use client"

import { useState, useEffect } from "react"
import { login } from "@/lib/api"

async function checkLoggedIn(): Promise<boolean> {
  try {
    const res = await fetch("/api/v2/torrents/info", {
      credentials: "same-origin",
      headers: { "Referer": window.location.origin },
    })
    // Check both status and that we get valid JSON response
    if (!res.ok) return false
    
    // Try to parse as JSON - if it fails, we're not properly authenticated
    const data = await res.json()
    // qBittorrent returns an array for torrents/info endpoint
    return Array.isArray(data)
  } catch {
    return false
  }
}

export function LoginForm({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    checkLoggedIn().then(setAuthed)
  }, [])

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
        await new Promise(r => setTimeout(r, 150))
        setAuthed(true)
        window.dispatchEvent(new CustomEvent("qbt-login-success"))
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

  if (authed === null) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center">
        <span className="text-sm text-muted-foreground">...</span>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center px-3 py-4 sm:px-4 sm:py-6">
        <form onSubmit={handleSubmit} className="login-form flex w-full max-w-md flex-col items-stretch gap-3 sm:gap-0">
          {/* Desktop: horizontal bar; Mobile: stacked */}
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

  return <>{children}</>
}
