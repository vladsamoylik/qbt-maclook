"use client"

import { useEffect } from "react"
import { useTorrentStore } from "@/lib/torrent-store"
import { WhiteSurIcon } from "@/components/whitesur-icon"

export function ApiErrorBanner() {
  const { error } = useTorrentStore()

  const errorMessage = error instanceof Error ? error.message : String(error)
  const isAuthError = !!(error && (
    errorMessage.includes("401") ||
    errorMessage.includes("403") ||
    errorMessage.includes("Forbidden") ||
    errorMessage.includes("Unauthorized")
  ))

  // Auto-reload on auth error after 2 seconds (only when not in grace period)
  useEffect(() => {
    if (isAuthError && !(window as any).__qbt_just_logged_in) {
      const timer = setTimeout(() => window.location.reload(), 2000)
      return () => clearTimeout(timer)
    }
  }, [isAuthError])

  // Don't show error if we just logged in (grace period)
  if ((window as any).__qbt_just_logged_in) return null
  if (!error) return null

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center gap-2 bg-destructive/90 text-destructive-foreground px-4 py-2 text-sm">
      <WhiteSurIcon name="warning-symbolic" size={13} className="h-3 w-3 shrink-0" />
      <span>
        {isAuthError 
          ? "Session expired. Reloading page..."
          : "Cannot connect to qBittorrent. Check if qBittorrent-nox is running."
        }
      </span>
    </div>
  )
}
