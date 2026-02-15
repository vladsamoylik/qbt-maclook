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
      <span className="hidden xl:inline">{label}</span>
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
    <th className={cn("finder-table-header-cell p-0 align-middle", className)}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "flex w-full items-center gap-1 border-none bg-transparent px-0 py-2 text-left text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-0 cursor-pointer",
          justify,
          align === "right" && "text-right",
          align === "center" && "text-center justify-center"
        )}
        aria-sort={isActive ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
      >
        <span>{label}</span>
        <span
          className={cn("shrink-0 w-3 text-center", isActive ? "text-foreground" : "invisible")}
          aria-hidden
        >
          {sortDirection === "asc" ? "\u2191" : "\u2193"}
        </span>
      </button>
    </th>
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
  const rowRefsMap = useRef<Map<number, HTMLTableRowElement | null>>(new Map())

  const getCurrentIndex = useCallback(() => {
    if (selectedTorrentHashes.size === 0) return -1
    const indices = filteredTorrents
      .map((t, i) => (selectedTorrentHashes.has(t.hash) ? i : -1))
      .filter((i) => i >= 0)
    return indices.length === 0 ? -1 : Math.max(...indices)
  }, [filteredTorrents, selectedTorrentHashes])

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
      if (!target.closest(".finder-table-body tr")) return
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
        rowRefsMap.current.get(newIndex)?.scrollIntoView({ block: "nearest", behavior: "smooth" })
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
    if (!(e.target as HTMLElement).closest('tbody tr')) {
      clearSelection()
    }
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSelection()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [clearSelection])

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-x-auto" onClick={handleBackgroundClick}>
        <ScrollArea className="min-h-0 flex-1">
        <div
          className="finder-table mx-0 mb-2 pt-1"
          role="table"
          aria-label="Torrent list"
          onKeyDown={handleTableKeyDown}
          tabIndex={-1}
        >
          <table className="w-full min-w-0 xl:min-w-[640px] table-fixed border-collapse border-separate finder-table-spacing">
            <thead>
              <tr className="finder-table-header sticky top-0 z-10 bg-card">
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
                  className="hidden w-[11ch] min-w-[11ch] max-w-[11ch] px-3 xl:table-cell justify-end whitespace-nowrap"
                  align="right"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="progress"
                  label="Progress"
                  className="w-[5ch] min-w-[5ch] max-w-[5ch] xl:w-[14ch] xl:min-w-[14ch] xl:max-w-[14ch] pl-2 pr-3 justify-center whitespace-nowrap"
                  align="center"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="state"
                  label="Status"
                  className="hidden w-[18ch] min-w-[18ch] max-w-[18ch] xl:w-[14ch] xl:min-w-[14ch] xl:max-w-[14ch] px-3 justify-start whitespace-nowrap lg:table-cell"
                  align="left"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="num_seeds"
                  label="Seeds"
                  className="hidden w-[6ch] min-w-[6ch] max-w-[6ch] px-3 xl:table-cell justify-start whitespace-nowrap"
                  align="left"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="num_leechs"
                  label="Peers"
                  className="hidden w-[6ch] min-w-[6ch] max-w-[6ch] px-3 xl:table-cell justify-start whitespace-nowrap"
                  align="left"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="dlspeed"
                  label="Down"
                  className="hidden w-[14ch] min-w-[14ch] max-w-[14ch] px-3 xl:table-cell justify-start whitespace-nowrap"
            align="left"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            field="upspeed"
            label="Up"
            className="hidden w-[14ch] min-w-[14ch] max-w-[14ch] px-3 xl:table-cell justify-start whitespace-nowrap"
            align="left"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <SortableHeader
            field="eta"
            label="ETA"
            className="hidden w-[8ch] min-w-[8ch] max-w-[8ch] px-3 xl:table-cell justify-start whitespace-nowrap"
            align="left"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody className="finder-table-body">
              {filteredTorrents.map((torrent, index) => {
                const isSelected = selectedTorrentHashes.has(torrent.hash)
                return (
                  <tr
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
                    <td className={cn("min-w-0 px-3 py-1 align-middle overflow-hidden border-l-2", isSelected ? "border-l-[#0064e1]" : "border-l-transparent")}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{torrent.name}</p>
                          {torrent.category && (
                            <p className="truncate text-caption text-muted-foreground mt-0.5">{torrent.category}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden w-[11ch] min-w-[11ch] max-w-[11ch] px-3 py-1 text-right tabular-nums text-muted-foreground whitespace-nowrap align-middle xl:table-cell">
                      {formatBytes(torrent.size)}
                    </td>
                    <td className="w-[5ch] min-w-[5ch] max-w-[5ch] xl:w-[14ch] xl:min-w-[14ch] xl:max-w-[14ch] px-2 py-1 align-middle">
                      {/* Mobile: percent only */}
                      <span className="text-caption tabular-nums text-muted-foreground xl:hidden">
                        {(torrent.progress * 100).toFixed(0)}%
                      </span>
                      {/* Desktop: progress bar + percent */}
                      <div className="hidden xl:flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", getProgressColor(torrent.progress, torrent.state))}
                            style={{ width: `${Math.min(torrent.progress * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-caption tabular-nums text-muted-foreground w-8 text-right shrink-0">
                          {(torrent.progress * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="hidden w-[18ch] min-w-[18ch] max-w-[18ch] xl:w-[14ch] xl:min-w-[14ch] xl:max-w-[14ch] px-3 py-1 text-left whitespace-nowrap align-middle lg:table-cell">
                      <StatusCell torrent={torrent} />
                    </td>
                    <td className="hidden w-[6ch] min-w-[6ch] max-w-[6ch] px-3 py-1 text-left tabular-nums text-muted-foreground whitespace-nowrap align-middle xl:table-cell">
                      {torrent.num_seeds}
                    </td>
                    <td className="hidden w-[6ch] min-w-[6ch] max-w-[6ch] px-3 py-1 text-left tabular-nums text-muted-foreground whitespace-nowrap align-middle xl:table-cell">
                      {torrent.num_leechs}
                    </td>
                    <td className="hidden w-[14ch] min-w-[14ch] max-w-[14ch] h-5 px-3 py-1 text-left tabular-nums align-middle xl:table-cell">
                      {torrent.dlspeed > 0 ? (
                        <span className="flex items-center gap-1 whitespace-nowrap text-primary">
                          <WhiteSurIcon name="download-symbolic" size={10} className="h-2.5 w-2.5 shrink-0" />
                          <span>{formatSpeed(torrent.dlspeed)}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">{"\u2014"}</span>
                      )}
                    </td>
                    <td className="hidden w-[14ch] min-w-[14ch] max-w-[14ch] h-5 px-3 py-1 text-left tabular-nums align-middle xl:table-cell">
                      {torrent.upspeed > 0 ? (
                        <span className="flex items-center gap-1 whitespace-nowrap text-success">
                          <WhiteSurIcon name="upload-symbolic" size={10} className="h-2.5 w-2.5 shrink-0" />
                          <span>{formatSpeed(torrent.upspeed)}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">{"\u2014"}</span>
                      )}
                    </td>
                    <td className="hidden w-[8ch] min-w-[8ch] max-w-[8ch] px-3 py-1 text-left tabular-nums text-muted-foreground whitespace-nowrap align-middle xl:table-cell">
                      {torrent.progress >= 1 ? "\u2014" : formatETA(torrent.eta)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  )
}
