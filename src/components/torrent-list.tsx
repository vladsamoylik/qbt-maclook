"use client"

import { useEffect, useMemo, useRef, useCallback } from "react"
import { WhiteSurIcon } from "@/components/whitesur-icon"
import { cn } from "@/lib/utils"
import { useTorrentStore } from "@/lib/torrent-store"
import type { SortField } from "@/lib/types"
import { formatBytes, formatSpeed, formatETA, getStateLabel, getProgressColor } from "@/lib/format"
import { StatusIcon } from "@/components/status-icon"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Torrent } from "@/lib/types"

function StatusCell({ torrent }: { torrent: Torrent }) {
  const { state } = torrent
  const label = getStateLabel(state)
  return (
    <span className="inline-flex items-center justify-start gap-1.5 text-muted-foreground" title={label}>
      <StatusIcon state={state} size={14} />
      <span className="hidden lg:inline">{label}</span>
    </span>
  )
}

function SortableHeader({
  field,
  label,
  className,
  align = "left",
  sortField,
  sortDirection,
  onSort,
}: {
  field: SortField
  label: string
  className?: string
  align?: "left" | "center" | "right"
  sortField: SortField
  sortDirection: "asc" | "desc"
  onSort: (field: SortField) => void
}) {
  const isActive = sortField === field
  const justify = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"
  return (
    <div role="columnheader" className={cn("finder-table-header-cell p-0 align-middle", className)}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "column-label flex w-full items-center gap-1 border-none bg-transparent px-0 py-1.5 text-left transition-colors hover:text-foreground focus:outline-none focus-visible:ring-0 cursor-pointer",
          justify,
          align === "right" && "text-right",
          align === "center" && "text-center justify-center"
        )}
        aria-sort={isActive ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
      >
        <span className="whitespace-nowrap">{label}</span>
        <span
          className={cn("shrink-0 w-3 text-center", isActive ? "text-foreground" : "invisible")}
          aria-hidden
        >
          {sortDirection === "asc" ? "\u2191" : "\u2193"}
        </span>
      </button>
    </div>
  )
}

export function TorrentList() {
  const {
    filteredTorrents,
    selectedTorrentHashes,
    selectTorrent,
    clearSelection,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
  } = useTorrentStore()

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection(field === "name" ? "asc" : "desc")
    }
  }

  const orderedHashes = useMemo(() => filteredTorrents.map((t) => t.hash), [filteredTorrents])
  const rowRefsMap = useRef<Map<number, HTMLDivElement | null>>(new Map())

  const getCurrentIndex = useCallback(() => {
    if (selectedTorrentHashes.size === 0) return -1
    const indices = filteredTorrents
      .map((t, i) => (selectedTorrentHashes.has(t.hash) ? i : -1))
      .filter((i) => i >= 0)
    return indices.length === 0 ? -1 : Math.max(...indices)
  }, [filteredTorrents, selectedTorrentHashes])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSelection()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [clearSelection])

  const getCurrentIndexForUp = useCallback(() => {
    if (selectedTorrentHashes.size === 0) return -1
    const indices = filteredTorrents
      .map((t, i) => (selectedTorrentHashes.has(t.hash) ? i : -1))
      .filter((i) => i >= 0)
    return indices.length === 0 ? -1 : Math.min(...indices)
  }, [filteredTorrents, selectedTorrentHashes])

  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        clearSelection()
        return
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
      const target = e.target as HTMLElement
      if (!target.closest(".finder-table-body .finder-table-row")) return
      e.preventDefault()
      const n = orderedHashes.length
      if (n === 0) return
      let newIndex: number
      if (e.key === "ArrowDown") {
        const current = getCurrentIndex()
        newIndex = Math.min(current + 1, n - 1)
      } else {
        const current = getCurrentIndexForUp()
        newIndex = current <= 0 ? 0 : current - 1
      }
      const hash = orderedHashes[newIndex]
      selectTorrent(hash, newIndex, false, e.shiftKey, orderedHashes)
      queueMicrotask(() => {
        rowRefsMap.current.get(newIndex)?.scrollIntoView({ block: "nearest", behavior: "smooth", inline: "nearest" })
      })
    },
    [orderedHashes, selectTorrent, clearSelection, getCurrentIndex, getCurrentIndexForUp]
  )

  if (filteredTorrents.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        <p>No transfers found</p>
      </div>
    )
  }

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.finder-table-row')) {
      clearSelection()
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-x-hidden xl:overflow-x-auto" onClick={handleBackgroundClick}>
        <ScrollArea className="min-h-0 flex-1">
        <div
          className="finder-table finder-table-scroll-content finder-table-grid mx-0 mb-2"
          role="grid"
          aria-label="Torrent list"
          onKeyDown={handleTableKeyDown}
          tabIndex={-1}
        >
          <div className="finder-table-header sticky top-0 z-10 bg-card" role="row">
                <SortableHeader
                  field="name"
                  label="Name"
                  className="min-w-0 px-3 justify-start text-left"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="size"
                  label="Size"
                  className="finder-cell-fit hidden px-3 xl:table-cell justify-end whitespace-nowrap"
                  align="right"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="progress"
                  label="Progress"
                  className="finder-cell-fit pl-2 pr-3 justify-center whitespace-nowrap"
                  align="center"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="state"
                  label="Status"
                  className="finder-cell-fit hidden px-3 justify-start whitespace-nowrap lg:table-cell"
                  align="left"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="num_seeds"
                  label="Seeds"
                  className="finder-cell-fit hidden px-3 xl:table-cell justify-start whitespace-nowrap"
                  align="left"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="num_leechs"
                  label="Peers"
                  className="finder-cell-fit hidden px-3 xl:table-cell justify-start whitespace-nowrap"
                  align="left"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="dlspeed"
                  label="Down"
                  className="finder-cell-fit hidden px-3 xl:table-cell justify-start whitespace-nowrap"
            align="left"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            field="upspeed"
            label="Up"
            className="finder-cell-fit hidden px-3 xl:table-cell justify-start whitespace-nowrap"
            align="left"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            field="eta"
            label="ETA"
            className="finder-cell-fit hidden px-3 xl:table-cell justify-start whitespace-nowrap"
            align="left"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
          </div>
          <div className="finder-table-body">
              {filteredTorrents.map((torrent, index) => {
                const isSelected = selectedTorrentHashes.has(torrent.hash)
                return (
                  <div
                    key={torrent.hash}
                    ref={(el) => rowRefsMap.current.set(index, el)}
                    role="row"
                    tabIndex={0}
                    onClick={(e) => {
                      selectTorrent(torrent.hash, index, e.ctrlKey || e.metaKey, e.shiftKey, orderedHashes)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        selectTorrent(torrent.hash, index, e.ctrlKey || e.metaKey, e.shiftKey, orderedHashes)
                      }
                    }}
                    className={cn(
                      "finder-table-row cursor-pointer text-left select-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-body-sm",
                      isSelected && "finder-table-row-selected"
                    )}
                  >
                    <div role="gridcell" className={cn("finder-table-cell min-w-0 px-3 py-1 align-middle overflow-hidden border-l-2 border-l-transparent")}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{torrent.name}</p>
                          {torrent.category && (
                            <p className="truncate text-caption text-muted-foreground mt-0.5">{torrent.category}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div role="gridcell" className="finder-table-cell finder-cell-fit hidden px-3 py-1 text-right tabular-nums text-muted-foreground whitespace-nowrap align-middle xl:block">
                      {formatBytes(torrent.size)}
                    </div>
                    <div role="gridcell" className="finder-table-cell finder-cell-fit px-2 py-1 align-middle">
                      {/* Mobile: percent only */}
                      <span className="text-caption tabular-nums text-muted-foreground xl:hidden">
                        {(torrent.progress * 100).toFixed(0)}%
                      </span>
                      {/* Desktop: progress bar + percent */}
                      <div className="hidden xl:flex items-center gap-1.5">
                        <div className="h-1.5 min-w-16 flex-1 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", getProgressColor(torrent.progress, torrent.state))}
                            style={{ width: `${Math.min(torrent.progress * 100, 100)}%` }}
                          />
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-right text-caption tabular-nums text-muted-foreground">
                          {(torrent.progress * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div role="gridcell" className="finder-table-cell finder-cell-fit hidden px-3 py-1 text-left whitespace-nowrap align-middle lg:block">
                      <StatusCell torrent={torrent} />
                    </div>
                    <div role="gridcell" className="finder-table-cell finder-cell-fit hidden px-3 py-1 text-left tabular-nums text-muted-foreground whitespace-nowrap align-middle xl:block">
                      {torrent.num_seeds}
                    </div>
                    <div role="gridcell" className="finder-table-cell finder-cell-fit hidden px-3 py-1 text-left tabular-nums text-muted-foreground whitespace-nowrap align-middle xl:block">
                      {torrent.num_leechs}
                    </div>
                    <div role="gridcell" className="finder-table-cell finder-cell-fit hidden px-3 py-1 text-left tabular-nums align-middle xl:block">
                      {torrent.dlspeed > 0 ? (
                        <span className="flex items-center gap-1 whitespace-nowrap text-primary">
                          <WhiteSurIcon name="download-symbolic" size={10} className="h-2.5 w-2.5 shrink-0" />
                          <span>{formatSpeed(torrent.dlspeed)}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">{"\u2014"}</span>
                      )}
                    </div>
                    <div role="gridcell" className="finder-table-cell finder-cell-fit hidden px-3 py-1 text-left tabular-nums align-middle xl:block">
                      {torrent.upspeed > 0 ? (
                        <span className="flex items-center gap-1 whitespace-nowrap text-success">
                          <WhiteSurIcon name="upload-symbolic" size={10} className="h-2.5 w-2.5 shrink-0" />
                          <span>{formatSpeed(torrent.upspeed)}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">{"\u2014"}</span>
                      )}
                    </div>
                    <div role="gridcell" className="finder-table-cell finder-cell-fit hidden px-3 py-1 text-left tabular-nums text-muted-foreground whitespace-nowrap align-middle xl:block">
                      {torrent.progress >= 1 ? "\u2014" : formatETA(torrent.eta)}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
