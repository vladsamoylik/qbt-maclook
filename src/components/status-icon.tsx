"use client"

import { cn } from "@/lib/utils"
import type { TorrentState } from "@/lib/types"

const STATE_TO_ICON: Record<TorrentState, string> = {
  downloading: "downloading",
  metadata: "downloading",
  seeding: "seeding",
  completed: "completed",
  error: "errored",
  stalled: "errored",
  paused: "inactive",
  queued: "inactive",
  checking: "inactive",
}

const STATE_TO_COLOR: Record<TorrentState, string> = {
  downloading: "text-primary",
  metadata: "text-primary",
  seeding: "text-success",
  completed: "text-success",
  error: "text-destructive",
  stalled: "text-destructive",
  paused: "text-muted-foreground",
  queued: "text-muted-foreground",
  checking: "text-warning",
}

interface StatusIconProps {
  state: TorrentState
  className?: string
  size?: number
}

export function StatusIcon({ state, className, size = 14 }: StatusIconProps) {
  const icon = STATE_TO_ICON[state]
  const colorClass = STATE_TO_COLOR[state]
  const src = `/icons/status/${icon}.svg`
  return (
    <span
      className={cn("inline-block shrink-0", colorClass, className)}
      style={{
        width: size,
        height: size,
        maskImage: `url(${src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        backgroundColor: "currentColor",
      }}
      aria-hidden
    />
  )
}
