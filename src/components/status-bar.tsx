"use client"

import { Network, Wifi } from "lucide-react"
import { WhiteSurIcon } from "@/components/whitesur-icon"
import { useTorrentStore } from "@/lib/torrent-store"
import { formatBytes, formatSpeed } from "@/lib/format"

export function StatusBar() {
  const { transferInfo } = useTorrentStore()

  return (
    <footer
      className="status-bar hidden w-full shrink-0 items-center gap-4 border-t border-border/50 bg-muted/30 px-3 py-1.5 text-body-sm text-muted-foreground sm:flex"
      role="status"
      aria-label="Transfer statistics"
    >
      <span className="flex items-center gap-1.5">
        <Wifi className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
        <span className="capitalize">{transferInfo.connection_status}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Network className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        <span className="tabular-nums">{transferInfo.dht_nodes} DHT</span>
      </span>
      <span className="flex items-center gap-1.5">
        <WhiteSurIcon name="download-symbolic" size={14} className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        <span className="tabular-nums font-medium">{formatSpeed(transferInfo.dl_info_speed)}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <WhiteSurIcon name="upload-symbolic" size={14} className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
        <span className="tabular-nums font-medium">{formatSpeed(transferInfo.up_info_speed)}</span>
      </span>
      <span className="flex items-center gap-1 tabular-nums">
        <span>{formatBytes(transferInfo.dl_info_data)}</span>
        <span aria-hidden>/</span>
        <span>{formatBytes(transferInfo.up_info_data)}</span>
      </span>
    </footer>
  )
}
