"use client"

import { useTorrentStore } from "@/lib/torrent-store"
import { TorrentList } from "@/components/torrent-list"
import { DetailPanel } from "@/components/detail-panel"

export function ResizableDetailLayout() {
  const { showDetailPanel, detailPanelHeight, setShowDetailPanel, selectedTorrentHashes } = useTorrentStore()
  const hasSelection = selectedTorrentHashes.size > 0
  const showPanel = showDetailPanel && hasSelection

  return (
    <div className="flex flex-1 flex-col min-h-0 relative">
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden pt-2">
        <TorrentList />
      </div>
      {showPanel && (
        <>
          {/* Mobile: tap-to-close overlay (like sidebar), behind the detail panel */}
          <button
            type="button"
            aria-label="Close details"
            className="fixed inset-0 z-[25] lg:hidden"
            onClick={() => setShowDetailPanel(false)}
          />
          {/* Mobile: half-screen overlay (bottom), inset matches sidebar pl-2 (8px) on three sides */}
          <div
            className="detail-panel-surface fixed left-1 right-1 top-1/2 z-30 flex flex-col overflow-hidden lg:hidden"
            style={{ bottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
          >
            <DetailPanel />
          </div>
        </>
      )}
      {/* Desktop: inline panel; pt-5 px-6 pb-3 to match sidebar (pt-5/pb-3), px-6 for shadow */}
      <div
        className="hidden lg:block shrink-0 overflow-hidden transition-[height] duration-150 ease-out"
        style={{ height: showPanel ? detailPanelHeight + 32 : 0 }}
      >
        <div className="pt-5 px-3 pb-3">
          <div
            className="detail-panel-surface flex flex-col overflow-hidden min-h-0"
            style={{ height: detailPanelHeight }}
          >
            <DetailPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
