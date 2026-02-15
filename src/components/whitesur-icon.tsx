"use client"

import { cn } from "@/lib/utils"

/**
 * WhiteSur-style icon from https://github.com/vinceliuice/WhiteSur-icon-theme
 * Uses CSS mask so the icon inherits currentColor.
 */
const ICONS = [
  "add-symbolic",
  "add-files-symbolic",
  "check-symbolic",
  "chevron-down-symbolic",
  "chevron-right-symbolic",
  "chevron-up-symbolic",
  "chevron-symbolic",
  "close-symbolic",
  "delete-symbolic",
  "download-symbolic",
  "folder-download",
  "folder-symbolic",
  "harddrive-symbolic",
  "link-symbolic",
  "list-symbolic",
  "monitor-symbolic",
  "moon-symbolic",
  "pause-symbolic",
  "play-symbolic",
  "exit-symbolic",
  "search-symbolic",
  "settings-symbolic",
  "sun-symbolic",
  "upload-symbolic",
  "view-sidebar-symbolic",
  "hide-show-sidebar",
  "hide-show-details",
  "all-transfers",
  "logout",
  "pause-torrent",
  "resume-torrent",
  "search",
  "settings",
  "warning-symbolic",
] as const

export type WhiteSurIconName = (typeof ICONS)[number]

interface WhiteSurIconProps {
  name: WhiteSurIconName
  basePath?: string
  className?: string
  size?: number
}

export function WhiteSurIcon({ name, basePath = "/icons", className, size = 16 }: WhiteSurIconProps) {
  const src = `${basePath}/${name}.svg`
  return (
    <span
      className={cn("inline-block shrink-0", className)}
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
