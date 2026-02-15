"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsField, SettingsRow } from "@/components/settings-ui"
import { WhiteSurIcon } from "@/components/whitesur-icon"
import { cn } from "@/lib/utils"
import { useTorrentStore } from "@/lib/torrent-store"
interface AddTorrentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const NO_CATEGORY_VALUE = "__none__"

export function AddTorrentDialog({ open, onOpenChange }: AddTorrentDialogProps) {
  const { addTorrent, addTorrentFromFile, categories } = useTorrentStore()
  const [url, setUrl] = useState("")
  const [category, setCategory] = useState<string>(NO_CATEGORY_VALUE)
  const [startPaused, setStartPaused] = useState(false)
  const [savePath, setSavePath] = useState("/downloads")
  const [activeTab, setActiveTab] = useState<"url" | "file">("url")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddUrl = async () => {
    if (!url.trim()) return
    setError(null)
    setIsSubmitting(true)
    try {
      await addTorrent(
        url.trim(),
        category !== NO_CATEGORY_VALUE ? category : undefined,
        savePath || undefined,
        startPaused
      )
      setUrl("")
      setCategory(NO_CATEGORY_VALUE)
      setStartPaused(false)
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add torrent")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddFile = async () => {
    if (!selectedFile) return
    setError(null)
    setIsSubmitting(true)
    try {
      await addTorrentFromFile(
        selectedFile,
        category !== NO_CATEGORY_VALUE ? category : undefined,
        savePath || undefined,
        startPaused
      )
      setSelectedFile(null)
      setCategory(NO_CATEGORY_VALUE)
      setStartPaused(false)
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add torrent")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = () => {
    if (activeTab === "url") {
      handleAddUrl()
    } else {
      handleAddFile()
    }
  }

  const canSubmit =
    activeTab === "url" ? url.trim().length > 0 : selectedFile !== null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (
      file &&
      (file.name.endsWith(".torrent") || file.type === "application/x-bittorrent")
    ) {
      setSelectedFile(file)
    }
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (
      file &&
      (file.name.endsWith(".torrent") || file.type === "application/x-bittorrent")
    ) {
      setSelectedFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className={cn(
          "!fixed !max-w-none !p-0 overflow-hidden settings-dialog-window flex flex-col",
          /* Mobile: full viewport */
          "!inset-0 !left-0 !top-0 !right-0 !bottom-0 !w-full !h-full !translate-x-0 !translate-y-0 !rounded-none",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
          /* Desktop: centered window with chrome */
          "sm:!inset-auto sm:!left-1/2 sm:!top-1/2 sm:!right-auto sm:!bottom-auto sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:!w-[95vw] sm:!max-w-[520px] sm:!h-[90vh] sm:!max-h-[700px] sm:!rounded-[20px] sm:!p-0 sm:pt-0 sm:pb-0 sm:pl-0 sm:pr-0"
        )}
      >
        <DialogTitle className="sr-only">Add Transfer</DialogTitle>
        <div className="flex flex-col flex-1 min-h-0 p-4 pt-4 sm:p-6 sm:pt-10 overflow-y-auto">
          <h2 className="settings-dialog-title mb-3 sm:mb-4">Add Transfer</h2>

          <div className="settings-group add-transfer-panel mb-3 sm:mb-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "url" | "file")} className="flex flex-col">
              <TabsList className="add-transfer-tabs w-full h-10 rounded-t-[14px] rounded-b-none border-b border-border/40 p-1 shadow-none">
              <TabsTrigger
                value="url"
                className="add-transfer-tab flex-1 rounded-[14px] px-4 text-label font-medium text-foreground data-[state=active]:bg-white data-[state=active]:text-[#56a1ff] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[hsl(222,12%,11%)] dark:data-[state=active]:text-[#56a1ff]"
              >
                <WhiteSurIcon name="link-symbolic" size={11} className="mr-1.5 h-2.5 w-2.5" />
                URL / Magnet
              </TabsTrigger>
              <TabsTrigger
                value="file"
                className="add-transfer-tab flex-1 rounded-[14px] px-4 text-label font-medium text-foreground data-[state=active]:bg-white data-[state=active]:text-[#56a1ff] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[hsl(222,12%,11%)] dark:data-[state=active]:text-[#56a1ff]"
              >
                <WhiteSurIcon name="add-files-symbolic" size={11} className="mr-1.5 h-2.5 w-2.5" />
                Torrent File
              </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="mt-0 h-[160px] sm:h-[220px] min-h-[120px] px-4 pt-4 pb-4">
              <SettingsField
                id="torrent-url"
                label="Torrent URL or Magnet Link"
                desc="Enter a magnet link or URL to a .torrent file"
              >
                <Input
                  id="torrent-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="magnet:?xt=urn:btih:... or https://..."
                  className="mt-1.5 input-macos text-label font-mono"
                />
              </SettingsField>
              </TabsContent>

              <TabsContent value="file" className="mt-0 h-[160px] sm:h-[220px] min-h-[120px] px-4 pt-4 pb-4">
              <div className="settings-field">
                <span className="settings-field-label">
                  Torrent File
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".torrent,application/x-bittorrent"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                  className={cn(
                    "add-transfer-dropzone mt-1.5 flex flex-col items-center justify-center rounded-[18px] p-4 sm:p-8 text-center cursor-pointer transition-all min-h-[80px] sm:min-h-[140px]",
                    selectedFile && "add-transfer-dropzone-has-file",
                    isDragOver && "add-transfer-dropzone-dragover"
                  )}
                >
                  <WhiteSurIcon
                    name="add-files-symbolic"
                    size={26}
                    className="mb-2 h-7 w-7 text-muted-foreground"
                  />
                  {selectedFile ? (
                    <>
                      <p className="text-label font-medium truncate max-w-full">
                        {selectedFile.name}
                      </p>
                      <p className="mt-1 text-caption text-muted-foreground">
                        Click to change file
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-label font-medium">
                        Drop .torrent file here
                      </p>
                      <p className="mt-1 text-caption text-muted-foreground">
                        or click to browse
                      </p>
                    </>
                  )}
                </div>
              </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="settings-group add-transfer-panel mt-3 sm:mt-4">
            <div className="px-4 pt-4 pb-2 space-y-4">
              <SettingsField
                id="save-path"
                label="Save Path"
                desc="Folder where files will be downloaded"
              >
                <Input
                  id="save-path"
                  value={savePath}
                  onChange={(e) => setSavePath(e.target.value)}
                  className="mt-1.5 input-macos text-label font-mono"
                  placeholder="/downloads"
                />
              </SettingsField>
              <SettingsField id="category" label="Category">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger
                    id="category"
                    className="mt-1.5 input-macos h-10 min-w-0 border-0 text-label shadow-[var(--toolbar-shadow)] focus:ring-0 focus:ring-offset-0 [&[data-state=open]]:shadow-[0_0_0_3px_hsl(var(--ring)/0.25),var(--toolbar-shadow)]"
                  >
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                  <SelectContent className="settings-select dropdown-menu-content !py-1.5 !px-4 w-full min-w-48 [&>button]:hidden">
                    <SelectItem
                      value={NO_CATEGORY_VALUE}
                      className="dropdown-menu-item rounded-[9px] px-3 py-1 text-body-sm"
                    >
                      No category
                    </SelectItem>
                    {categories
                      .filter((c) => c.name)
                      .map((cat) => (
                        <SelectItem
                          key={cat.name}
                          value={cat.name}
                          className="dropdown-menu-item rounded-[9px] px-3 py-1 text-body-sm"
                        >
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </SettingsField>
            </div>
            <SettingsRow
              id="start-paused"
              title="Start Paused"
              desc="Add torrent without starting download"
            >
              <Switch
                id="start-paused"
                checked={startPaused}
                onCheckedChange={setStartPaused}
              />
            </SettingsRow>
          </div>

          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}

          <div className="mt-3 sm:mt-4 flex justify-end shrink-0">
            <div className="toolbar-btn-group h-10" role="group">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="flex h-full items-center px-4 text-label"
              >
                Cancel
              </button>
              <div
                className="toolbar-btn-group-divider"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="flex h-full items-center px-4 text-label text-primary"
              >
                {isSubmitting ? "Adding..." : "Add Transfer"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
