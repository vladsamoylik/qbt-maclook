"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { SettingsRow } from "@/components/settings-ui"
import { cn } from "@/lib/utils"

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  torrents: { hash: string; name: string }[]
  onConfirm: (deleteFiles: boolean) => void | Promise<void>
}

export function DeleteDialog({
  open,
  onOpenChange,
  torrents,
  onConfirm,
}: DeleteDialogProps) {
  const [deleteFiles, setDeleteFiles] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm(deleteFiles)
      setDeleteFiles(false)
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className={cn(
          "!fixed !max-w-none !p-0 overflow-hidden min-w-0 settings-dialog-window",
          /* Mobile: full viewport, no window chrome */
          "!inset-0 !left-0 !top-0 !right-0 !bottom-0 !w-full !h-full !translate-x-0 !translate-y-0 !rounded-none",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
          /* Desktop: centered window with chrome */
          "sm:!inset-auto sm:!left-1/2 sm:!top-1/2 sm:!right-auto sm:!bottom-auto sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:!w-[95vw] sm:!max-w-[440px] sm:!h-auto sm:!max-h-[min(90dvh,600px)] sm:!rounded-[20px] sm:!p-0 sm:pt-0 sm:pb-0 sm:pl-0 sm:pr-0"
        )}
      >
        <DialogTitle className="sr-only">Remove Transfer</DialogTitle>
        <div className="flex flex-col min-w-0 overflow-hidden p-4 pt-4 sm:p-6 sm:pt-10">
          <h2 className="settings-dialog-title mb-4">Remove Transfer</h2>

          <p className="text-label text-muted-foreground mb-4">
            {torrents.length === 1
              ? "Are you sure you want to remove this transfer?"
              : `Are you sure you want to remove ${torrents.length} transfers?`}
          </p>

          <div className="settings-group mb-4 min-w-0 overflow-hidden">
            <div className="min-w-0 overflow-hidden px-4 pt-4 pb-3 max-h-28 overflow-y-auto">
              {torrents.slice(0, 5).map((t) => (
                <p
                  key={t.hash}
                  className="text-label font-medium truncate py-0.5 block min-w-0 w-full"
                  title={t.name}
                >
                  {t.name}
                </p>
              ))}
              {torrents.length > 5 && (
                <p className="text-label text-muted-foreground py-0.5">
                  ...and {torrents.length - 5} more
                </p>
              )}
            </div>
          </div>

          <div className="settings-group">
            <SettingsRow
              id="delete-files"
              title="Also delete files"
              desc="Permanently remove downloaded data from disk"
            >
              <Switch
                id="delete-files"
                checked={deleteFiles}
                onCheckedChange={setDeleteFiles}
              />
            </SettingsRow>
          </div>

          <div className="mt-5 flex justify-end">
            <div className="toolbar-btn-group h-10" role="group">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isDeleting}
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
                onClick={handleConfirm}
                disabled={isDeleting || torrents.length === 0}
                className="flex h-full items-center px-4 text-label text-destructive"
              >
                {isDeleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
