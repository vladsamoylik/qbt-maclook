export function formatBytes(bytes: number, decimals = 1): string {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n < 0) return "0 B"
  if (n === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"]
  const i = Math.floor(Math.log(n) / Math.log(k))
  return `${parseFloat((n / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec === 0) return "0 B/s"
  return `${formatBytes(bytesPerSec)}/s`
}

export function formatETA(seconds: number): string {
  if (seconds <= 0 || seconds >= 8640000) return "\u221E"
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatRatio(ratio: number): string {
  return ratio.toFixed(2)
}

export function formatTimestamp(unixTimestamp: number): string {
  if (unixTimestamp === 0) return "\u2014"
  const date = new Date(unixTimestamp * 1000)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function getProgressColor(progress: number, state: string): string {
  if (state === "error") return "bg-destructive"
  if (state === "paused") return "bg-muted-foreground"
  if (state === "stalled") return "bg-warning"
  if (progress >= 1) return "bg-success"
  return "bg-primary"
}

export function getStateLabel(state: string): string {
  const labels: Record<string, string> = {
    downloading: "Downloading",
    seeding: "Seeding",
    paused: "Paused",
    queued: "Queued",
    checking: "Checking",
    error: "Error",
    completed: "Completed",
    stalled: "Stalled",
    metadata: "Metadata",
  }
  return labels[state] || state
}


export function getStateDot(state: string): string {
  const dots: Record<string, string> = {
    downloading: "bg-primary",
    seeding: "bg-success",
    paused: "bg-muted-foreground",
    queued: "bg-muted-foreground",
    checking: "bg-warning",
    error: "bg-destructive",
    completed: "bg-success",
    stalled: "bg-warning",
    metadata: "bg-primary",
  }
  return dots[state] || "bg-muted-foreground"
}
