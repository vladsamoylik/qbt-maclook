"use client"

import { useState } from "react"
import { WhiteSurIcon } from "@/components/whitesur-icon"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTorrentStore } from "@/lib/torrent-store"
import { cn } from "@/lib/utils"
import { AddTorrentDialog } from "@/components/add-torrent-dialog"
import { SettingsDialog } from "@/components/settings-dialog"
import { DeleteDialog } from "@/components/delete-dialog"
import { logout } from "@/lib/api"

interface ToolbarProps {
  onMenuClick?: () => void
}

export function Toolbar({ onMenuClick }: ToolbarProps) {
  const {
    torrents,
    selectedTorrentHashes,
    searchQuery,
    setSearchQuery,
    pauseTorrents,
    resumeTorrents,
    deleteTorrents,
    showDetailPanel,
    setShowDetailPanel,
  } = useTorrentStore()

  const selectedTorrents = torrents.filter((t) => selectedTorrentHashes.has(t.hash))

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      // Force clear any cached data before reload
      if ('caches' in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name)))
      }
      // Small delay to ensure logout completes
      await new Promise(resolve => setTimeout(resolve, 100))
      window.location.href = window.location.origin + window.location.pathname
    } catch (e) {
      console.error("Logout failed:", e)
      // Even if logout fails, force reload to login page
      window.location.href = window.location.origin + window.location.pathname
    }
  }

  const canPause =
    selectedTorrents.length > 0 &&
    selectedTorrents.some((t) => t.state !== "paused" && t.state !== "completed")
  const canResume =
    selectedTorrents.length > 0 &&
    selectedTorrents.some((t) => t.state === "paused" || t.state === "stalled")
  const canDelete = selectedTorrents.length > 0

  const torrentsToPause = torrents.filter((t) => t.state !== "paused" && t.state !== "completed")
  const torrentsToResume = torrents.filter((t) => t.state === "paused" || t.state === "stalled")
  const canPauseAll = torrentsToPause.length > 0
  const canResumeAll = torrentsToResume.length > 0

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex flex-1 min-w-0 items-center gap-4 px-2 [&_.toolbar-btn-group]:gap-0.5" role="toolbar" aria-label="Torrent actions">
        {/* Menu (mobile) */}
        {onMenuClick && (
          <div className="toolbar-btn-group lg:hidden" role="group" aria-label="Menu">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="toolbar-btn-group-icon-only"
                  onClick={onMenuClick}
                  aria-label="Open menu"
                >
                  <WhiteSurIcon name="list-symbolic" basePath="/icons/dashboard" size={16} className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Menu</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Add | Delete */}
        <div className="toolbar-btn-group" role="group" aria-label="Add and Delete">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="toolbar-btn-group-icon-only"
                onClick={() => setAddDialogOpen(true)}
                aria-label="Add torrent"
              >
                <WhiteSurIcon name="add-symbolic" basePath="/icons/dashboard" size={16} className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Add Torrent</TooltipContent>
          </Tooltip>
          <div className="toolbar-btn-group-divider" aria-hidden="true" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="toolbar-btn-group-icon-only text-destructive hover:text-destructive"
                disabled={!canDelete}
                onClick={() => setDeleteDialogOpen(true)}
                aria-label="Delete torrent"
              >
                <WhiteSurIcon name="delete-symbolic" basePath="/icons/dashboard" size={16} className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>

        <div className="toolbar-btn-group" role="group" aria-label="Selected controls">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="toolbar-btn-group-icon-only"
                disabled={!canPause}
                onClick={() => pauseTorrents(selectedTorrents.map((t) => t.hash))}
                aria-label="Pause selected"
              >
                <WhiteSurIcon name="pause-torrent" basePath="/icons/dashboard" size={16} className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Pause</TooltipContent>
          </Tooltip>
          <div className="toolbar-btn-group-divider" aria-hidden="true" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="toolbar-btn-group-icon-only"
                disabled={!canResume}
                onClick={() => resumeTorrents(selectedTorrents.map((t) => t.hash))}
                aria-label="Resume selected"
              >
                <WhiteSurIcon name="resume-torrent" basePath="/icons/dashboard" size={16} className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Resume</TooltipContent>
          </Tooltip>
        </div>

        <div className="toolbar-btn-group toolbar-all-mobile-hidden lg:flex" role="group" aria-label="All controls">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="toolbar-btn-group-icon-only"
                disabled={!canPauseAll}
                onClick={() => pauseTorrents(torrentsToPause.map((t) => t.hash))}
                aria-label="Pause all"
              >
                <img src="/icons/dashboard/pause-all.svg" alt="" className="h-4 w-4" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent>Pause All</TooltipContent>
          </Tooltip>
          <div className="toolbar-btn-group-divider" aria-hidden="true" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="toolbar-btn-group-icon-only"
                disabled={!canResumeAll}
                onClick={() => resumeTorrents(torrentsToResume.map((t) => t.hash))}
                aria-label="Resume all"
              >
                <img src="/icons/dashboard/start-all" alt="" className="h-4 w-4" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent>Resume All</TooltipContent>
          </Tooltip>
        </div>

        {/* Search - desktop only (disabled on mobile) */}
        <div className="ml-auto flex items-center gap-4">
          <div className="relative hidden lg:block">
            <WhiteSurIcon name="search" basePath="/icons/dashboard" size={13} className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search transfers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="toolbar-input h-10 w-48 pl-8 text-label focus-visible:ring-0 focus-visible:ring-offset-0 [&:focus]:outline-none"
              aria-label="Search transfers"
            />
          </div>

          {/* Detail panel toggle - hidden on mobile */}
          <div className="toolbar-btn-group toolbar-details-mobile-hidden lg:flex" role="group" aria-label="Details">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn("toolbar-btn-group-icon-only", showDetailPanel && "control-active text-primary")}
                  onClick={() => setShowDetailPanel(!showDetailPanel)}
                  aria-label={showDetailPanel ? "Hide detail panel" : "Show detail panel"}
                >
                  <WhiteSurIcon name="hide-show-details" basePath="/icons/dashboard" size={16} className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{showDetailPanel ? "Hide Details" : "Show Details"}</TooltipContent>
            </Tooltip>
          </div>

          {/* Settings - hidden on mobile */}
          <div className="toolbar-btn-group hidden lg:flex" role="group" aria-label="Settings">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="toolbar-btn-group-icon-only"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Settings"
                >
                  <WhiteSurIcon name="settings" basePath="/icons/dashboard" size={16} className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </div>
          {/* Logout - hidden on mobile */}
          <div className="toolbar-btn-group hidden lg:flex" role="group" aria-label="Logout">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="toolbar-btn-group-icon-only"
                  onClick={handleLogout}
                  aria-label="Logout"
                >
                  <WhiteSurIcon name="logout" basePath="/icons/dashboard" size={16} className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Logout</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <AddTorrentDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          torrents={selectedTorrents.map((t) => ({ hash: t.hash, name: t.name }))}
          onConfirm={async (deleteFiles) => {
            await deleteTorrents(selectedTorrents.map((t) => t.hash), deleteFiles)
          }}
        />
      </div>
    </TooltipProvider>
  )
}
