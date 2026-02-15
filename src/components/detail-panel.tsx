"use client"

import { Clock, Tag, Users } from "lucide-react"
import { WhiteSurIcon } from "@/components/whitesur-icon"
import useSWR from "swr"
import { useTorrentStore } from "@/lib/torrent-store"
import { formatBytes, formatSpeed, formatRatio, formatTimestamp, getStateLabel, getStateDot, getProgressColor } from "@/lib/format"
import { fetchTorrentFiles, fetchTorrentPeers, fetchTorrentTrackers } from "@/lib/api"
import type { TorrentFile, TorrentPeer, TorrentTracker } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start py-1">
      <dt className="w-28 shrink-0 text-label text-muted-foreground">{label}</dt>
      <dd className="text-label text-foreground min-w-0">{children}</dd>
    </div>
  )
}

function GeneralTab() {
  const { selectedTorrent } = useTorrentStore()
  if (!selectedTorrent) return null
  const t = selectedTorrent

  return (
    <div className="overflow-y-auto min-h-0 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
        <dl>
          <InfoRow label="Status">
            <span className="flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", getStateDot(t.state))} />
              {getStateLabel(t.state)}
            </span>
          </InfoRow>
          <InfoRow label="Progress">
            <span className="flex items-center gap-2">
              <span className="tabular-nums">{(t.progress * 100).toFixed(1)}%</span>
              <div className="h-1.5 w-24 rounded-full bg-secondary overflow-hidden">
                <div className={cn("h-full rounded-full", getProgressColor(t.progress, t.state))} style={{ width: `${t.progress * 100}%` }} />
              </div>
            </span>
          </InfoRow>
          <InfoRow label="Size">{formatBytes(t.size)}</InfoRow>
          <InfoRow label="Downloaded">{formatBytes(t.total_downloaded)}</InfoRow>
          <InfoRow label="Uploaded">{formatBytes(t.total_uploaded)}</InfoRow>
          <InfoRow label="Ratio">
            <span className="tabular-nums">{formatRatio(t.ratio)}</span>
          </InfoRow>
        </dl>
        <dl>
          <InfoRow label="Down Speed">
            <span className="flex items-center gap-1 tabular-nums">
              <WhiteSurIcon name="download-symbolic" size={10} className="h-2.5 w-2.5 text-primary" />
              {formatSpeed(t.dlspeed)}
            </span>
          </InfoRow>
          <InfoRow label="Up Speed">
            <span className="flex items-center gap-1 tabular-nums">
              <WhiteSurIcon name="upload-symbolic" size={10} className="h-2.5 w-2.5 text-success" />
              {formatSpeed(t.upspeed)}
            </span>
          </InfoRow>
          <InfoRow label="Seeds">{t.num_seeds} ({t.num_complete} total)</InfoRow>
          <InfoRow label="Peers">{t.num_leechs} ({t.num_incomplete} total)</InfoRow>
          <InfoRow label="Added">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {formatTimestamp(t.added_on)}
            </span>
          </InfoRow>
          <InfoRow label="Completed">{formatTimestamp(t.completion_on)}</InfoRow>
        </dl>
        <dl className="detail-panel-divider col-span-2 mt-1 border-t pt-2">
          <InfoRow label="Save Path">
            <span className="flex items-center gap-1 font-mono text-caption">
              <WhiteSurIcon name="folder-symbolic" size={10} className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
              <span className="truncate">{t.save_path}</span>
            </span>
          </InfoRow>
          <InfoRow label="Category">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {t.category || "\u2014"}
            </span>
          </InfoRow>
          <InfoRow label="Tags">
            {t.tags.length > 0 ? (
              <span className="flex items-center gap-1 flex-wrap">
                {t.tags.map((tag) => (
                  <span key={tag} className="rounded-sm bg-secondary px-1.5 py-0.5 text-caption font-medium text-secondary-foreground">
                    {tag}
                  </span>
                ))}
              </span>
            ) : "\u2014"}
          </InfoRow>
          <InfoRow label="Hash">
            <span className="font-mono text-caption text-muted-foreground select-all">{t.hash}</span>
          </InfoRow>
        </dl>
      </div>
    </div>
  )
}

function FilesTab({ hash }: { hash: string }) {
  const { data: files = [] } = useSWR<TorrentFile[]>(hash ? `files-${hash}` : null, () => fetchTorrentFiles(hash))
  return (
    <TooltipProvider delayDuration={300}>
      <ScrollArea className="h-full">
        <div className="p-4">
          <div className="finder-table-header flex items-center px-3 py-2 text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="finder-table-header-cell w-12 shrink-0">#</div>
            <div className="finder-table-header-cell min-w-0 flex-1 pl-3">Name</div>
            <div className="finder-table-header-cell w-24 shrink-0 text-right">Size</div>
            <div className="finder-table-header-cell w-20 shrink-0 text-right">Progress</div>
          </div>
          <div className="finder-table-body">
            {files.map((file: TorrentFile) => (
              <div key={file.index} className="finder-table-row flex w-full min-w-0 items-center overflow-hidden px-3 py-1.5 pr-4 text-label">
                <div className="w-12 shrink-0 overflow-hidden text-ellipsis tabular-nums text-muted-foreground">{file.index}</div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="min-w-0 flex-1 truncate pl-3 font-mono cursor-default">
                      {file.name}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[min(90vw,500px)] break-all font-mono text-label">
                    {file.name}
                  </TooltipContent>
                </Tooltip>
                <div className="w-24 shrink-0 overflow-hidden text-ellipsis text-right tabular-nums text-muted-foreground">{formatBytes(file.size)}</div>
                <div className="w-20 shrink-0 overflow-hidden text-ellipsis text-right tabular-nums">{(file.progress * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </TooltipProvider>
  )
}

function PeersTab({ hash }: { hash: string }) {
  const { data: peers = [] } = useSWR<TorrentPeer[]>(hash ? `peers-${hash}` : null, () => fetchTorrentPeers(hash))
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="finder-table-header flex items-center px-3 py-2 text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="finder-table-header-cell min-w-0 flex-1">IP</div>
          <div className="finder-table-header-cell w-24 shrink-0">Client</div>
          <div className="finder-table-header-cell w-20 shrink-0 text-right">Down</div>
          <div className="finder-table-header-cell w-20 shrink-0 text-right">Up</div>
          <div className="finder-table-header-cell w-16 shrink-0 text-right">Progress</div>
          <div className="finder-table-header-cell w-20 shrink-0 text-center">Type</div>
        </div>
        <div className="finder-table-body">
          {peers.map((peer: TorrentPeer, i: number) => (
            <div key={i} className="finder-table-row flex w-full items-center px-3 py-1.5 pr-4 text-body-sm">
              <div className="min-w-0 flex-1 font-mono text-caption">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{peer.ip}:{peer.port}</span>
                </span>
              </div>
              <div className="w-24 shrink-0 truncate text-muted-foreground">{peer.client}</div>
              <div className="w-20 shrink-0 text-right tabular-nums text-primary">{formatSpeed(peer.dl_speed)}</div>
              <div className="w-20 shrink-0 text-right tabular-nums text-success">{formatSpeed(peer.up_speed)}</div>
              <div className="w-16 shrink-0 text-right tabular-nums">{(peer.progress * 100).toFixed(0)}%</div>
              <div className="w-20 shrink-0 text-center">
                <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-caption-xs font-medium text-secondary-foreground">
                  {peer.connection}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

function TrackersTab({ hash }: { hash: string }) {
  const { data: trackers = [] } = useSWR<TorrentTracker[]>(hash ? `trackers-${hash}` : null, () => fetchTorrentTrackers(hash))
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="finder-table-header flex items-center px-3 py-2 text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="finder-table-header-cell min-w-0 flex-1">URL</div>
          <div className="finder-table-header-cell w-16 shrink-0 text-right">Seeds</div>
          <div className="finder-table-header-cell w-16 shrink-0 text-right">Peers</div>
          <div className="finder-table-header-cell w-16 shrink-0 text-right">Leeches</div>
          <div className="finder-table-header-cell w-24 shrink-0">Status</div>
        </div>
        <div className="finder-table-body">
          {trackers.map((tracker: TorrentTracker, i: number) => (
            <div key={i} className="finder-table-row flex w-full items-center px-3 py-1.5 pr-4 text-body-sm">
              <div className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-mono text-caption">
                  <WhiteSurIcon name="link-symbolic" size={10} className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{tracker.url}</span>
                </span>
              </div>
              <div className="w-16 shrink-0 text-right tabular-nums">{tracker.num_seeds}</div>
              <div className="w-16 shrink-0 text-right tabular-nums">{tracker.num_peers}</div>
              <div className="w-16 shrink-0 text-right tabular-nums">{tracker.num_leeches}</div>
              <div className="w-24 shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tracker.status === 2 ? "bg-success" : "bg-warning")} />
                  <span className="truncate text-muted-foreground">{tracker.msg}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

export function DetailPanel() {
  const { selectedTorrent, selectedTorrentHashes, showDetailPanel } = useTorrentStore()
  const multiCount = selectedTorrentHashes.size

  if (!showDetailPanel) return null

  if (!selectedTorrent) {
    return (
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex flex-1 items-center justify-center p-6 text-caption text-muted-foreground">
          Select a transfer to view details
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {multiCount > 1 && (
        <div className="detail-panel-divider sidebar-section-header border-b px-4 py-2">
          {multiCount} transfers selected, showing details for active
        </div>
      )}
      <Tabs defaultValue="general" className="flex flex-1 flex-col overflow-hidden">
        <div className="finder-table-header px-4">
          <TabsList className="h-9 bg-transparent p-0 gap-0">
            <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent px-3 pb-2.5 pt-2 text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              General
            </TabsTrigger>
            <TabsTrigger value="files" className="rounded-none border-b-2 border-transparent px-3 pb-2.5 pt-2 text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Files
            </TabsTrigger>
            <TabsTrigger value="peers" className="rounded-none border-b-2 border-transparent px-3 pb-2.5 pt-2 text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Peers
            </TabsTrigger>
            <TabsTrigger value="trackers" className="rounded-none border-b-2 border-transparent px-3 pb-2.5 pt-2 text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Trackers
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="general" className="flex-1 m-0 overflow-hidden">
          <GeneralTab />
        </TabsContent>
        <TabsContent value="files" className="flex-1 m-0 overflow-hidden">
          <FilesTab hash={selectedTorrent.hash} />
        </TabsContent>
        <TabsContent value="peers" className="flex-1 m-0 overflow-hidden">
          <PeersTab hash={selectedTorrent.hash} />
        </TabsContent>
        <TabsContent value="trackers" className="flex-1 m-0 overflow-hidden">
          <TrackersTab hash={selectedTorrent.hash} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
