"use client"

import { TorrentProvider } from "@/lib/torrent-store"
import { Toolbar } from "@/components/toolbar"
import { ResizableDetailLayout } from "@/components/resizable-detail-layout"
import { StatusBar } from "@/components/status-bar"
import { ApiErrorBanner } from "@/components/api-error-banner"
import { LoginForm } from "@/components/login-form"
import { useThemeAuto } from "@/components/theme-toggle"

function AppLayout() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <ApiErrorBanner />

      <div className="flex min-h-0 flex-1 min-w-0 flex-col px-3">
        <header className="flex min-w-0 shrink-0 items-center bg-card pb-6 pt-3">
          <Toolbar onMenuClick={undefined} />
        </header>
        <main className="flex flex-1 flex-col min-h-0">
          <ResizableDetailLayout />
        </main>
      </div>

      <StatusBar />
    </div>
  )
}

export default function App() {
  useThemeAuto()

  return (
    <TorrentProvider>
      <LoginForm>
        <AppLayout />
      </LoginForm>
    </TorrentProvider>
  )
}
