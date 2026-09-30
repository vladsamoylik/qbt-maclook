"use client"

import { useState, useEffect, Fragment } from "react"
import useSWR from "swr"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { SettingsField, SettingsRow } from "@/components/settings-ui"
import { WhiteSurIcon } from "@/components/whitesur-icon"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { fetchAppPreferences, setAppPreferences, changePassword, type AppPreferences } from "@/lib/api"
import { getStoredTheme, setStoredTheme, type ThemeMode } from "@/lib/theme"
interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const settingsSections = [
  { id: "Appearance" as const, label: "Appearance", icon: "/icons/settings/appearance.svg" },
  { id: "Downloads" as const, label: "Downloads", icon: "/icons/settings/downloads.svg" },
  { id: "Connection" as const, label: "Connection", icon: "/icons/settings/connection.svg" },
  { id: "Speed" as const, label: "Speed", icon: "/icons/settings/speed.svg" },
  { id: "BitTorrent" as const, label: "BitTorrent", icon: "/icons/settings/bittorrent.svg" },
  { id: "Web UI" as const, label: "Web UI", icon: "/icons/settings/webui.svg" },
]
type Section = (typeof settingsSections)[number]["id"]

function usePreferences(open: boolean) {
  return useSWR<Partial<AppPreferences>>(
    open ? "app/preferences" : null,
    () => fetchAppPreferences(),
    { revalidateOnFocus: false }
  )
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { data: prefs, isLoading, mutate } = usePreferences(open)
  const [activeSection, setActiveSection] = useState<Section>("Appearance")
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredTheme())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<AppPreferences>>({})
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    if (prefs) setForm(prefs)
  }, [prefs])

  useEffect(() => {
    if (open) setThemeMode(getStoredTheme())
  }, [open])

  const update = <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      const toSave = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== undefined && v !== null)
      ) as Partial<AppPreferences>
      await setAppPreferences(toSave)
      mutate(form, false)
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setError(null)
    setPasswordSuccess(false)
    
    if (!newPassword) {
      setError("Password cannot be empty")
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setPasswordChanging(true)
    try {
      await changePassword(newPassword)
      setPasswordSuccess(true)
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to change password")
    } finally {
      setPasswordChanging(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className={cn(
          "!fixed !max-w-none !p-0 settings-dialog-window",
          /* Mobile: full viewport, edge-to-edge */
          "!inset-0 !left-0 !top-0 !right-0 !bottom-0 !w-full !h-full !translate-x-0 !translate-y-0 !rounded-none",
          /* Desktop: centered window */
          "sm:!inset-auto sm:!left-1/2 sm:!top-1/2 sm:!right-auto sm:!bottom-auto sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:!w-[95vw] sm:!max-w-[680px] sm:!h-[min(90dvh,800px)] sm:!rounded-[var(--radius-sheet)] sm:!p-0 sm:pt-0 sm:pb-0 sm:pl-0 sm:pr-0"
        )}
      >
        <DialogTitle className="sr-only">Options</DialogTitle>
        <div className="settings-dialog flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
          <>
              <div className="relative flex flex-1 min-h-0 min-w-0 overflow-hidden min-w-0 settings-dialog-inner">
                {/* Overlays first in DOM so they paint before content (no lag on open) */}
                <div className="settings-dialog-header-overlay">
                  <header className="settings-dialog-header settings-content-frame pt-4 pb-3 sm:pt-5 sm:pb-3" aria-label="Settings sections">
                    <div className="toolbar-btn-group h-10" role="group">
                      {settingsSections.map((section, index) => (
                        <Fragment key={section.id}>
                          {index > 0 && <div className="toolbar-btn-group-divider" aria-hidden="true" />}
                          <button
                            onClick={() => setActiveSection(section.id)}
                            className={cn(
                              "settings-dialog-nav-btn",
                              activeSection === section.id && "settings-dialog-nav-btn-active"
                            )}
                            title={section.label}
                          >
                            <img src={section.icon} alt="" className="h-[18px] w-[18px] shrink-0 opacity-80" aria-hidden />
                            <span className="settings-dialog-nav-label">{section.label}</span>
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </header>
                </div>
                <div className="settings-dialog-footer-overlay">
                  {error && <p className="settings-content-frame pb-2 text-body-sm text-destructive">{error}</p>}
                  <div className="settings-dialog-footer dialog-actions settings-content-frame pt-4 pb-3 sm:pt-5 sm:pb-3">
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      disabled={saving}
                      className="glass-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || isLoading}
                      className="glass-btn glass-btn-prominent"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
                <ScrollArea type="scroll" scrollHideDelay={500} className="absolute inset-0 z-0 settings-content-scroll">
                  <div className="settings-content-body settings-content-frame settings-content-with-overlays">
                  {/* Spacer for sidebar overlay */}
                  <div className="settings-content-top-spacer" aria-hidden />
                  {activeSection !== "Appearance" && isLoading ? (
                    <div className="flex min-h-[360px] flex-1 items-center justify-center text-muted-foreground text-body-sm">Loading preferences...</div>
                  ) : (
                  <>
                  {activeSection === "Appearance" && (
                    <>
                      <h2 className="settings-dialog-title">Appearance</h2>
                      <p className="text-body-sm text-muted-foreground mb-4">
                        Client-side preferences (stored in browser, not sent to qBittorrent)
                      </p>
                      <SettingsField id="theme" label="Theme" desc="Light, dark, or follow system">
                        <Select
                          value={themeMode}
                          onValueChange={(v: ThemeMode) => {
                            setThemeMode(v)
                            setStoredTheme(v)
                          }}
                        >
                          <SelectTrigger id="theme" className="mt-1.5 input-macos h-10 min-w-0 border-0 text-label shadow-[var(--toolbar-shadow)] focus:ring-0 focus:ring-offset-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="settings-select dropdown-menu-content !py-1.5 !px-4 w-64 min-w-64 [&>button]:hidden">
                            <SelectItem value="system" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">System</SelectItem>
                            <SelectItem value="light" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">Light</SelectItem>
                            <SelectItem value="dark" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">Dark</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingsField>
                    </>
                  )}
                  {activeSection === "Downloads" && (
                    <>
                      <h2 className="settings-dialog-title">Downloads</h2>
                      <SettingsField id="save-path" label="Default Save Path">
                        <Input
                          id="save-path"
                          value={form.save_path ?? ""}
                          onChange={(e) => update("save_path", e.target.value)}
                          className="mt-1.5 input-macos text-label font-mono"
                          placeholder="/downloads"
                        />
                      </SettingsField>
                      <SettingsField id="temp-path" label="Incomplete Files Path">
                        <Input
                          id="temp-path"
                          value={form.temp_path ?? ""}
                          onChange={(e) => update("temp_path", e.target.value)}
                          className="mt-1.5 input-macos text-label font-mono"
                          placeholder="/downloads/incomplete"
                        />
                      </SettingsField>
                      <div className="settings-group">
                        <SettingsRow
                          id="temp-enabled"
                          title="Put incomplete files in"
                          desc="Store incomplete torrents in the path above"
                        >
                          <Switch
                            id="temp-enabled"
                            checked={form.temp_path_enabled ?? false}
                            onCheckedChange={(v) => update("temp_path_enabled", v)}
                          />
                        </SettingsRow>
                        <SettingsRow
                          id="prealloc"
                          title="Pre-allocate disk space"
                          desc="Allocate file space before download starts"
                        >
                          <Switch
                            id="prealloc"
                            checked={form.preallocate_all ?? false}
                            onCheckedChange={(v) => update("preallocate_all", v)}
                          />
                        </SettingsRow>
                        <SettingsRow id="subfolder" title="Create subfolder for multi-file torrents">
                          <Switch
                            id="subfolder"
                            checked={form.create_subfolder_enabled ?? true}
                            onCheckedChange={(v) => update("create_subfolder_enabled", v)}
                          />
                        </SettingsRow>
                        <SettingsRow id="start-paused" title="Start torrents in paused state">
                          <Switch
                            id="start-paused"
                            checked={form.start_paused_enabled ?? false}
                            onCheckedChange={(v) => update("start_paused_enabled", v)}
                          />
                        </SettingsRow>
                        <SettingsRow
                          id="auto-tmm"
                          title="Automatic torrent management"
                          desc="Relocate torrents when paths change"
                        >
                          <Switch
                            id="auto-tmm"
                            checked={form.auto_tmm_enabled ?? false}
                            onCheckedChange={(v) => update("auto_tmm_enabled", v)}
                          />
                        </SettingsRow>
                        <SettingsRow
                          id="incomplete-ext"
                          title="Append .!qB to incomplete files"
                          desc="Helps identify incomplete downloads"
                        >
                          <Switch
                            id="incomplete-ext"
                            checked={form.incomplete_files_ext ?? false}
                            onCheckedChange={(v) => update("incomplete_files_ext", v)}
                          />
                        </SettingsRow>
                      </div>
                      <SettingsField id="export-dir" label="Copy .torrent files to" desc="For all downloads">
                        <Input
                          id="export-dir"
                          value={form.export_dir ?? ""}
                          onChange={(e) => update("export_dir", e.target.value)}
                          className="mt-1.5 input-macos text-label font-mono"
                          placeholder="/path/to/copy"
                        />
                      </SettingsField>
                      <SettingsField id="export-dir-fin" label="Copy .torrent files for completed to">
                        <Input
                          id="export-dir-fin"
                          value={form.export_dir_fin ?? ""}
                          onChange={(e) => update("export_dir_fin", e.target.value)}
                          className="mt-1.5 input-macos text-label font-mono"
                          placeholder="/path/for/completed"
                        />
                      </SettingsField>
                      <div className="settings-group">
                        {(form.auto_tmm_enabled ?? false) && (
                          <div className="settings-group mt-2">
                            <SettingsRow
                              id="tmm-torrent"
                              title="Relocate when torrent's category changes"
                            >
                              <Switch
                                id="tmm-torrent"
                                checked={form.torrent_changed_tmm_enabled ?? false}
                                onCheckedChange={(v) => update("torrent_changed_tmm_enabled", v)}
                              />
                            </SettingsRow>
                            <SettingsRow
                              id="tmm-save"
                              title="Relocate when default save path changes"
                            >
                              <Switch
                                id="tmm-save"
                                checked={form.save_path_changed_tmm_enabled ?? false}
                                onCheckedChange={(v) => update("save_path_changed_tmm_enabled", v)}
                              />
                            </SettingsRow>
                            <SettingsRow
                              id="tmm-category"
                              title="Relocate when category save path changes"
                            >
                              <Switch
                                id="tmm-category"
                                checked={form.category_changed_tmm_enabled ?? false}
                                onCheckedChange={(v) => update("category_changed_tmm_enabled", v)}
                              />
                            </SettingsRow>
                          </div>
                        )}
                        <SettingsRow
                          id="autorun"
                          title="Run external program on completion"
                          desc="Use %f for torrent path, %n for name"
                        >
                          <Switch
                            id="autorun"
                            checked={form.autorun_enabled ?? false}
                            onCheckedChange={(v) => update("autorun_enabled", v)}
                          />
                        </SettingsRow>
                      </div>
                      {(form.autorun_enabled ?? false) && (
                        <SettingsField id="autorun-prog" label="Program">
                          <Input
                            id="autorun-prog"
                            value={form.autorun_program ?? ""}
                            onChange={(e) => update("autorun_program", e.target.value)}
                            className="mt-1.5 input-macos text-label font-mono"
                            placeholder="/usr/bin/script.sh %f"
                          />
                        </SettingsField>
                      )}
                    </>
                  )}

                  {activeSection === "Connection" && (
                    <>
                      <h2 className="settings-dialog-title">Connection</h2>
                      <SettingsField id="port" label="Listening Port">
                        <Input
                          id="port"
                          type="number"
                          value={form.listen_port ?? 6881}
                          onChange={(e) => update("listen_port", parseInt(e.target.value, 10) || 0)}
                          className="mt-1.5 input-macos w-24 text-label font-mono shrink-0"
                          min={1}
                          max={65535}
                        />
                      </SettingsField>
                      <div className="settings-group">
                        <SettingsRow
                          id="upnp"
                          title="UPnP / NAT-PMP"
                          desc="Automatically forward port on router"
                        >
                          <Switch id="upnp" checked={form.upnp ?? true} onCheckedChange={(v) => update("upnp", v)} />
                        </SettingsRow>
                        <SettingsRow id="random-port" title="Use different port on each startup">
                          <Switch
                            id="random-port"
                            checked={form.random_port ?? false}
                            onCheckedChange={(v) => update("random_port", v)}
                          />
                        </SettingsRow>
                      </div>
                      <SettingsField id="max-conn" label="Maximum Connections (Global)">
                        <Input
                          id="max-conn"
                          type="number"
                          value={form.max_connec ?? 500}
                          onChange={(e) => update("max_connec", parseInt(e.target.value, 10) || 0)}
                          className="mt-1.5 input-macos w-24 text-label font-mono shrink-0"
                        />
                      </SettingsField>
                      <SettingsField id="max-conn-per" label="Max Connections per Torrent">
                        <Input
                          id="max-conn-per"
                          type="number"
                          value={form.max_connec_per_torrent ?? 100}
                          onChange={(e) =>
                            update("max_connec_per_torrent", parseInt(e.target.value, 10) || 0)
                          }
                          className="mt-1.5 input-macos w-24 text-label font-mono shrink-0"
                        />
                      </SettingsField>
                      <SettingsField id="max-up" label="Max Upload Slots (Global)">
                        <Input
                          id="max-up"
                          type="number"
                          value={form.max_uploads ?? -1}
                          onChange={(e) => {
                            const v = e.target.value
                            update("max_uploads", v === "" ? -1 : parseInt(v, 10) || 0)
                          }}
                          className="mt-1.5 input-macos w-24 text-label font-mono shrink-0"
                          placeholder="-1"
                        />
                      </SettingsField>
                      <SettingsField id="max-up-per" label="Max Upload Slots per Torrent">
                        <Input
                          id="max-up-per"
                          type="number"
                          value={form.max_uploads_per_torrent ?? -1}
                          onChange={(e) => {
                            const v = e.target.value
                            update("max_uploads_per_torrent", v === "" ? -1 : parseInt(v, 10) || 0)
                          }}
                          className="mt-1.5 input-macos w-24 text-label font-mono shrink-0"
                          placeholder="-1"
                        />
                      </SettingsField>
                      <div className="settings-group">
                        <SettingsRow
                          id="limit-lan"
                          title="Apply rate limits to peers on LAN"
                          desc="Limit speeds for local network peers too"
                        >
                          <Switch
                            id="limit-lan"
                            checked={form.limit_lan_peers ?? false}
                            onCheckedChange={(v) => update("limit_lan_peers", v)}
                          />
                        </SettingsRow>
                      </div>
                      <h3 className="text-base font-semibold mt-6 mb-3 text-foreground">Proxy Server</h3>
                      <SettingsField id="proxy-type" label="Proxy type">
                        <Select
                          value={String(form.proxy_type ?? -1)}
                          onValueChange={(v) => update("proxy_type", parseInt(v, 10))}
                        >
                          <SelectTrigger id="proxy-type" className="mt-1.5 input-macos h-10 min-w-0 border-0 text-label shadow-[var(--toolbar-shadow)] focus:ring-0 focus:ring-offset-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="settings-select dropdown-menu-content !py-1.5 !px-4 w-64 min-w-64 [&>button]:hidden">
                            <SelectItem value="-1" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">Disabled</SelectItem>
                            <SelectItem value="1" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">HTTP</SelectItem>
                            <SelectItem value="2" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">SOCKS5</SelectItem>
                            <SelectItem value="3" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">HTTP (auth)</SelectItem>
                            <SelectItem value="4" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">SOCKS5 (auth)</SelectItem>
                            <SelectItem value="5" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">SOCKS4</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingsField>
                      {(form.proxy_type ?? -1) >= 1 && (
                        <>
                          <SettingsField id="proxy-ip" label="Proxy IP">
                            <Input
                              id="proxy-ip"
                              value={form.proxy_ip ?? ""}
                              onChange={(e) => update("proxy_ip", e.target.value)}
                              className="mt-1.5 input-macos text-label font-mono"
                              placeholder="127.0.0.1"
                            />
                          </SettingsField>
                          <SettingsField id="proxy-port" label="Proxy Port">
                            <Input
                              id="proxy-port"
                              type="number"
                              value={form.proxy_port ?? 8080}
                              onChange={(e) => update("proxy_port", parseInt(e.target.value, 10) || 8080)}
                              className="mt-1.5 input-macos w-24 text-label font-mono"
                            />
                          </SettingsField>
                          {((form.proxy_type ?? -1) === 3 || (form.proxy_type ?? -1) === 4) && (
                            <>
                              <SettingsField id="proxy-user" label="Proxy Username">
                                <Input
                                  id="proxy-user"
                                  value={form.proxy_username ?? ""}
                                  onChange={(e) => update("proxy_username", e.target.value)}
                                  className="mt-1.5 input-macos text-label"
                                />
                              </SettingsField>
                              <SettingsField id="proxy-pass" label="Proxy Password">
                                <Input
                                  id="proxy-pass"
                                  type="password"
                                  value={form.proxy_password ?? ""}
                                  onChange={(e) => update("proxy_password", e.target.value)}
                                  className="mt-1.5 input-macos text-label"
                                />
                              </SettingsField>
                            </>
                          )}
                        </>
                      )}
                      <h3 className="text-base font-semibold mt-6 mb-3 text-foreground">IP Filtering</h3>
                      <div className="settings-group">
                        <SettingsRow
                          id="ip-filter"
                          title="Enable IP filter"
                          desc="Block peers using filter file"
                        >
                          <Switch
                            id="ip-filter"
                            checked={form.ip_filter_enabled ?? false}
                            onCheckedChange={(v) => update("ip_filter_enabled", v)}
                          />
                        </SettingsRow>
                      </div>
                      {(form.ip_filter_enabled ?? false) && (
                        <SettingsField id="ip-filter-path" label="Filter file path">
                          <Input
                            id="ip-filter-path"
                            value={form.ip_filter_path ?? ""}
                            onChange={(e) => update("ip_filter_path", e.target.value)}
                            className="mt-1.5 input-macos text-label font-mono"
                            placeholder="/path/to/ipfilter.dat"
                          />
                        </SettingsField>
                      )}
                    </>
                  )}

                  {activeSection === "Speed" && (
                    <>
                      <h2 className="settings-dialog-title">Speed</h2>
                      <div className="settings-field">
                        <Label className="settings-field-label">
                          Global Download Limit (KiB/s):{" "}
                          {(form.dl_limit ?? -1) <= 0 ? "Unlimited" : form.dl_limit}
                        </Label>
                        <Slider
                          value={[
                            (form.dl_limit ?? -1) <= 0 ? 0 : Math.min(form.dl_limit ?? 0, 100000),
                          ]}
                          onValueChange={([v]) => update("dl_limit", v === 0 ? -1 : v)}
                          max={100000}
                          step={100}
                          className="mt-3"
                        />
                        <p className="settings-field-desc">0 = unlimited</p>
                      </div>
                      <div className="settings-field">
                        <Label className="settings-field-label">
                          Global Upload Limit (KiB/s):{" "}
                          {(form.up_limit ?? -1) <= 0 ? "Unlimited" : form.up_limit}
                        </Label>
                        <Slider
                          value={[
                            (form.up_limit ?? -1) <= 0 ? 0 : Math.min(form.up_limit ?? 0, 100000),
                          ]}
                          onValueChange={([v]) => update("up_limit", v === 0 ? -1 : v)}
                          max={100000}
                          step={100}
                          className="mt-3"
                        />
                        <p className="settings-field-desc">0 = unlimited</p>
                      </div>
                      <h3 className="text-base font-semibold mt-6 mb-3 text-foreground">Alternative Rate Limits</h3>
                      <div className="settings-group">
                        <SettingsRow
                          id="alt-limits-desc"
                          title="Alternative limits (reduced speed when enabled)"
                          desc="Use schedule below or toolbar toggle"
                        />
                      </div>
                      <SettingsField id="alt-dl" label="Alternative Download Limit (KiB/s)">
                        <Input
                          id="alt-dl"
                          type="number"
                          value={form.alt_dl_limit ?? -1}
                          onChange={(e) => update("alt_dl_limit", parseInt(e.target.value, 10) ?? -1)}
                          className="mt-1.5 input-macos w-24 text-label font-mono"
                          placeholder="-1 = unlimited"
                        />
                      </SettingsField>
                      <SettingsField id="alt-up" label="Alternative Upload Limit (KiB/s)">
                        <Input
                          id="alt-up"
                          type="number"
                          value={form.alt_up_limit ?? -1}
                          onChange={(e) => update("alt_up_limit", parseInt(e.target.value, 10) ?? -1)}
                          className="mt-1.5 input-macos w-24 text-label font-mono"
                          placeholder="-1 = unlimited"
                        />
                      </SettingsField>
                      <h3 className="text-base font-semibold mt-6 mb-3 text-foreground">Scheduler</h3>
                      <div className="settings-group">
                        <SettingsRow
                          id="scheduler"
                          title="Enable scheduled speed limits"
                          desc="Apply alternative limits within schedule"
                        >
                          <Switch
                            id="scheduler"
                            checked={form.scheduler_enabled ?? false}
                            onCheckedChange={(v) => update("scheduler_enabled", v)}
                          />
                        </SettingsRow>
                      </div>
                      {(form.scheduler_enabled ?? false) && (
                        <>
                          <SettingsField id="sched-from" label="From (time)">
                            <div className="flex gap-2 items-center mt-1.5">
                              <Input
                                id="sched-from"
                                type="number"
                                min={0}
                                max={23}
                                value={form.schedule_from_hour ?? 0}
                                onChange={(e) => update("schedule_from_hour", parseInt(e.target.value, 10) || 0)}
                                className="input-macos w-16 text-label font-mono"
                              />
                              <span className="text-muted-foreground">:</span>
                              <Input
                                type="number"
                                min={0}
                                max={59}
                                value={form.schedule_from_min ?? 0}
                                onChange={(e) => update("schedule_from_min", parseInt(e.target.value, 10) || 0)}
                                className="input-macos w-16 text-label font-mono"
                              />
                            </div>
                          </SettingsField>
                          <SettingsField id="sched-to" label="To (time)">
                            <div className="flex gap-2 items-center mt-1.5">
                              <Input
                                id="sched-to"
                                type="number"
                                min={0}
                                max={23}
                                value={form.schedule_to_hour ?? 0}
                                onChange={(e) => update("schedule_to_hour", parseInt(e.target.value, 10) || 0)}
                                className="input-macos w-16 text-label font-mono"
                              />
                              <span className="text-muted-foreground">:</span>
                              <Input
                                type="number"
                                min={0}
                                max={59}
                                value={form.schedule_to_min ?? 0}
                                onChange={(e) => update("schedule_to_min", parseInt(e.target.value, 10) || 0)}
                                className="input-macos w-16 text-label font-mono"
                              />
                            </div>
                          </SettingsField>
                          <SettingsField id="sched-days" label="Days">
                            <Select
                              value={String(form.scheduler_days ?? 0)}
                              onValueChange={(v) => update("scheduler_days", parseInt(v, 10))}
                            >
                              <SelectTrigger id="sched-days" className="mt-1.5 input-macos h-10 min-w-0 border-0 text-label shadow-[var(--toolbar-shadow)] focus:ring-0 focus:ring-offset-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="settings-select dropdown-menu-content !py-1.5 !px-4 w-64 min-w-64 [&>button]:hidden">
                                <SelectItem value="0" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">Every day</SelectItem>
                                <SelectItem value="1" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">Weekdays</SelectItem>
                                <SelectItem value="2" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">Weekends</SelectItem>
                                <SelectItem value="3" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">Monday</SelectItem>
                                <SelectItem value="4" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">Tuesday</SelectItem>
                                <SelectItem value="5" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">Wednesday</SelectItem>
                                <SelectItem value="6" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">Thursday</SelectItem>
                                <SelectItem value="7" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">Friday</SelectItem>
                                <SelectItem value="8" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">Saturday</SelectItem>
                                <SelectItem value="9" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">Sunday</SelectItem>
                              </SelectContent>
                            </Select>
                          </SettingsField>
                        </>
                      )}
                      <h3 className="text-base font-semibold mt-6 mb-3 text-foreground">Slow Torrents</h3>
                      <div className="settings-group">
                        <SettingsRow
                          id="dont-count-slow"
                          title="Don't count slow torrents in these limits"
                          desc="Exclude torrents below threshold from global limits"
                        >
                          <Switch
                            id="dont-count-slow"
                            checked={form.dont_count_slow_torrents ?? false}
                            onCheckedChange={(v) => update("dont_count_slow_torrents", v)}
                          />
                        </SettingsRow>
                      </div>
                      {(form.dont_count_slow_torrents ?? false) && (
                        <>
                          <SettingsField id="slow-dl" label="Slow download threshold (KiB/s)">
                            <Input
                              id="slow-dl"
                              type="number"
                              value={form.slow_torrent_dl_rate_threshold ?? 10}
                              onChange={(e) => update("slow_torrent_dl_rate_threshold", parseInt(e.target.value, 10) || 0)}
                              className="mt-1.5 input-macos w-24 text-label font-mono"
                            />
                          </SettingsField>
                          <SettingsField id="slow-up" label="Slow upload threshold (KiB/s)">
                            <Input
                              id="slow-up"
                              type="number"
                              value={form.slow_torrent_ul_rate_threshold ?? 10}
                              onChange={(e) => update("slow_torrent_ul_rate_threshold", parseInt(e.target.value, 10) || 0)}
                              className="mt-1.5 input-macos w-24 text-label font-mono"
                            />
                          </SettingsField>
                          <SettingsField id="slow-inactive" label="Inactive timer (s)">
                            <Input
                              id="slow-inactive"
                              type="number"
                              value={form.slow_torrent_inactive_timer ?? 60}
                              onChange={(e) => update("slow_torrent_inactive_timer", parseInt(e.target.value, 10) || 0)}
                              className="mt-1.5 input-macos w-24 text-label font-mono"
                            />
                          </SettingsField>
                        </>
                      )}
                      <h3 className="text-base font-semibold mt-6 mb-3 text-foreground">Queue</h3>
                      <div className="settings-group">
                        <SettingsRow id="queue" title="Enable queuing">
                          <Switch
                            id="queue"
                            checked={form.queueing_enabled ?? false}
                            onCheckedChange={(v) => update("queueing_enabled", v)}
                          />
                        </SettingsRow>
                      </div>
                      {(form.queueing_enabled ?? false) && (
                        <>
                          <SettingsField id="max-active-dl" label="Max Active Downloads">
                            <Input
                              id="max-active-dl"
                              type="number"
                              value={form.max_active_downloads ?? 3}
                              onChange={(e) =>
                                update("max_active_downloads", parseInt(e.target.value, 10) || 0)
                              }
                              className="mt-1.5 input-macos w-20 text-label font-mono shrink-0"
                            />
                          </SettingsField>
                          <SettingsField id="max-active-up" label="Max Active Uploads">
                            <Input
                              id="max-active-up"
                              type="number"
                              value={form.max_active_uploads ?? 3}
                              onChange={(e) =>
                                update("max_active_uploads", parseInt(e.target.value, 10) || 0)
                              }
                              className="mt-1.5 input-macos w-20 text-label font-mono shrink-0"
                            />
                          </SettingsField>
                          <SettingsField id="max-active-t" label="Max Active Torrents">
                            <Input
                              id="max-active-t"
                              type="number"
                              value={form.max_active_torrents ?? 5}
                              onChange={(e) =>
                                update("max_active_torrents", parseInt(e.target.value, 10) || 0)
                              }
                              className="mt-1.5 input-macos w-20 text-label font-mono shrink-0"
                            />
                          </SettingsField>
                        </>
                      )}
                    </>
                  )}

                  {activeSection === "BitTorrent" && (
                    <>
                      <h2 className="settings-dialog-title">BitTorrent</h2>
                      <div className="settings-group">
                        <SettingsRow
                          id="dht"
                          title="DHT (Distributed Hash Table)"
                          desc="Enable DHT for peer discovery"
                        >
                          <Switch id="dht" checked={form.dht ?? true} onCheckedChange={(v) => update("dht", v)} />
                        </SettingsRow>
                        <SettingsRow
                          id="pex"
                          title="PeX (Peer Exchange)"
                          desc="Exchange peer lists with other clients"
                        >
                          <Switch id="pex" checked={form.pex ?? true} onCheckedChange={(v) => update("pex", v)} />
                        </SettingsRow>
                        <SettingsRow
                          id="lsd"
                          title="LSD (Local Service Discovery)"
                          desc="Discover peers on local network"
                        >
                          <Switch id="lsd" checked={form.lsd ?? true} onCheckedChange={(v) => update("lsd", v)} />
                        </SettingsRow>
                      </div>
                      <SettingsField id="encryption" label="Encryption">
                        <Select
                          value={String(form.encryption ?? 0)}
                          onValueChange={(v) => update("encryption", parseInt(v, 10))}
                        >
                          <SelectTrigger id="encryption" className="mt-1.5 input-macos h-10 min-w-0 border-0 text-label shadow-[var(--toolbar-shadow)] focus:ring-0 focus:ring-offset-0 [&[data-state=open]]:shadow-[0_0_0_3px_hsl(var(--ring)/0.25),var(--toolbar-shadow)]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="settings-select dropdown-menu-content !py-1.5 !px-4 w-64 min-w-64 [&>button]:hidden">
                            <SelectItem value="0" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">
                              Prefer encryption
                            </SelectItem>
                            <SelectItem value="1" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">
                              Force encryption on
                            </SelectItem>
                            <SelectItem value="2" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">
                              Force encryption off
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingsField>
                      <SettingsField id="bt-protocol" label="BitTorrent Protocol">
                        <Select
                          value={String(form.bittorrent_protocol ?? 0)}
                          onValueChange={(v) => update("bittorrent_protocol", parseInt(v, 10))}
                        >
                          <SelectTrigger id="bt-protocol" className="mt-1.5 input-macos h-10 min-w-0 border-0 text-label shadow-[var(--toolbar-shadow)] focus:ring-0 focus:ring-offset-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="settings-select dropdown-menu-content !py-1.5 !px-4 w-64 min-w-64 [&>button]:hidden">
                            <SelectItem value="0" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">TCP and μTP</SelectItem>
                            <SelectItem value="1" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">TCP only</SelectItem>
                            <SelectItem value="2" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">μTP only</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingsField>
                      <div className="settings-group">
                        <SettingsRow
                          id="anonymous"
                          title="Anonymous mode"
                          desc="Don't report client/tracker info to peers"
                        >
                          <Switch
                            id="anonymous"
                            checked={form.anonymous_mode ?? false}
                            onCheckedChange={(v) => update("anonymous_mode", v)}
                          />
                        </SettingsRow>
                      </div>
                      <div className="settings-group">
                        <SettingsRow
                          id="ratio"
                          title="Share ratio limit"
                          desc="Stop seeding when ratio is reached"
                        >
                          <Switch
                            id="ratio"
                            checked={form.max_ratio_enabled ?? false}
                            onCheckedChange={(v) => update("max_ratio_enabled", v)}
                          />
                        </SettingsRow>
                      </div>
                      {(form.max_ratio_enabled ?? false) && (
                        <>
                          <SettingsField id="ratio-limit" label="Ratio Limit">
                            <Input
                              id="ratio-limit"
                              type="number"
                              step={0.1}
                              value={form.max_ratio ?? -1}
                              onChange={(e) => update("max_ratio", parseFloat(e.target.value) ?? -1)}
                              className="mt-1.5 input-macos w-24 text-label font-mono shrink-0"
                              placeholder="-1 = disabled"
                            />
                          </SettingsField>
                          <SettingsField id="ratio-act" label="When ratio reached">
                            <Select
                              value={String(form.max_ratio_act ?? 0)}
                              onValueChange={(v) => update("max_ratio_act", parseInt(v, 10))}
                            >
                              <SelectTrigger id="ratio-act" className="mt-1.5 input-macos h-10 min-w-0 border-0 text-label shadow-[var(--toolbar-shadow)] focus:ring-0 focus:ring-offset-0 [&[data-state=open]]:shadow-[0_0_0_3px_hsl(var(--ring)/0.25),var(--toolbar-shadow)]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="settings-select dropdown-menu-content !py-1.5 !px-4 w-64 min-w-64 [&>button]:hidden">
                                <SelectItem value="0" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">
                                  Pause torrent
                                </SelectItem>
                                <SelectItem value="1" className="dropdown-menu-item rounded-[var(--radius-menu-item)] px-3 py-1 text-body-sm">
                                  Remove torrent
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </SettingsField>
                        </>
                      )}
                      <div className="settings-group">
                        <SettingsRow
                          id="max-seeding-time"
                          title="Maximum seeding time"
                          desc="Stop seeding after N minutes"
                        >
                          <Switch
                            id="max-seeding-time"
                            checked={form.max_seeding_time_enabled ?? false}
                            onCheckedChange={(v) => update("max_seeding_time_enabled", v)}
                          />
                        </SettingsRow>
                      </div>
                      {(form.max_seeding_time_enabled ?? false) && (
                        <SettingsField id="max-seeding-min" label="Minutes">
                          <Input
                            id="max-seeding-min"
                            type="number"
                            min={0}
                            value={form.max_seeding_time ?? 0}
                            onChange={(e) => update("max_seeding_time", parseInt(e.target.value, 10) || 0)}
                            className="mt-1.5 input-macos w-24 text-label font-mono"
                          />
                        </SettingsField>
                      )}
                      <SettingsField
                        id="add-trackers"
                        label="Add trackers to new torrents"
                        desc="One per line"
                      >
                        <textarea
                          id="add-trackers"
                          value={form.add_trackers ?? ""}
                          onChange={(e) => update("add_trackers", e.target.value)}
                          className="mt-1.5 input-macos flex min-h-16 w-full rounded-md border px-3 py-2 text-label font-mono text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="https://..."
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <Switch
                            id="add-trackers-en"
                            checked={form.add_trackers_enabled ?? false}
                            onCheckedChange={(v) => update("add_trackers_enabled", v)}
                          />
                          <Label htmlFor="add-trackers-en" className="text-label cursor-pointer">
                            Enable
                          </Label>
                        </div>
                      </SettingsField>
                    </>
                  )}

                  {activeSection === "Web UI" && (
                    <>
                      <h2 className="settings-dialog-title">Web UI</h2>
                      <SettingsField id="locale" label="Language" desc="Server locale (e.g. en_GB)">
                        <Input
                          id="locale"
                          value={form.locale ?? ""}
                          onChange={(e) => update("locale", e.target.value)}
                          className="mt-1.5 input-macos text-label"
                          placeholder="en"
                        />
                      </SettingsField>
                      <div className="settings-group">
                        <SettingsRow
                          id="alt-webui"
                          title="Use alternative Web UI"
                          desc="Serve a different UI (e.g. this app)"
                        >
                          <Switch
                            id="alt-webui"
                            checked={form.alternative_webui_enabled ?? false}
                            onCheckedChange={(v) => update("alternative_webui_enabled", v)}
                          />
                        </SettingsRow>
                      </div>
                      {(form.alternative_webui_enabled ?? false) && (
                        <SettingsField id="alt-webui-path" label="Alternative Web UI path">
                          <Input
                            id="alt-webui-path"
                            value={form.alternative_webui_path ?? ""}
                            onChange={(e) => update("alternative_webui_path", e.target.value)}
                            className="mt-1.5 input-macos text-label font-mono"
                            placeholder="/path/to/webui"
                          />
                        </SettingsField>
                      )}
                      <SettingsField
                        id="webui-port"
                        label="Web UI Port"
                        desc="Restart qBittorrent for port change"
                      >
                        <Input
                          id="webui-port"
                          type="number"
                          value={form.web_ui_port ?? 8080}
                          onChange={(e) =>
                            update("web_ui_port", parseInt(e.target.value, 10) || 8080)
                          }
                          className="mt-1.5 input-macos w-24 text-label font-mono shrink-0"
                          min={1}
                          max={65535}
                        />
                      </SettingsField>
                      <SettingsField id="webui-user" label="Web UI Username">
                        <Input
                          id="webui-user"
                          value={form.web_ui_username ?? "admin"}
                          onChange={(e) => update("web_ui_username", e.target.value)}
                          className="mt-1.5 input-macos w-full text-label"
                        />
                      </SettingsField>
                      <div className="settings-group">
                        <SettingsRow
                          id="bypass-local"
                          title="Bypass authentication for localhost"
                          desc="No password when accessing from 127.0.0.1"
                        >
                          <Switch
                            id="bypass-local"
                            checked={form.bypass_local_auth ?? false}
                            onCheckedChange={(v) => update("bypass_local_auth", v)}
                          />
                        </SettingsRow>
                        <SettingsRow
                          id="bypass-subnet"
                          title="Bypass authentication for whitelisted IPs"
                          desc="Comma-separated subnets (e.g. 192.168.1.0/24)"
                        >
                          <Switch
                            id="bypass-subnet"
                            checked={form.bypass_auth_subnet_whitelist_enabled ?? false}
                            onCheckedChange={(v) => update("bypass_auth_subnet_whitelist_enabled", v)}
                          />
                        </SettingsRow>
                      </div>
                      {(form.bypass_auth_subnet_whitelist_enabled ?? false) && (
                        <SettingsField id="subnet-list" label="Whitelisted subnets">
                          <Input
                            id="subnet-list"
                            value={form.bypass_auth_subnet_whitelist ?? ""}
                            onChange={(e) => update("bypass_auth_subnet_whitelist", e.target.value)}
                            className="mt-1.5 input-macos text-label font-mono"
                            placeholder="192.168.1.0/24, 10.0.0.0/8"
                          />
                        </SettingsField>
                      )}
                      <h3 className="text-base font-semibold mt-6 mb-3 text-foreground">Security</h3>
                      <SettingsField id="auth-fail-count" label="Max authentication failures">
                        <Input
                          id="auth-fail-count"
                          type="number"
                          min={0}
                          value={form.web_ui_max_auth_fail_count ?? 5}
                          onChange={(e) => update("web_ui_max_auth_fail_count", parseInt(e.target.value, 10) ?? 5)}
                          className="mt-1.5 input-macos w-24 text-label font-mono"
                        />
                      </SettingsField>
                      <SettingsField id="ban-duration" label="Ban duration (seconds)">
                        <Input
                          id="ban-duration"
                          type="number"
                          min={0}
                          value={form.web_ui_ban_duration ?? 3600}
                          onChange={(e) => update("web_ui_ban_duration", parseInt(e.target.value, 10) ?? 3600)}
                          className="mt-1.5 input-macos w-24 text-label font-mono"
                        />
                      </SettingsField>
                      <SettingsField id="session-timeout" label="Session timeout (seconds)">
                        <Input
                          id="session-timeout"
                          type="number"
                          min={0}
                          value={form.web_ui_session_timeout ?? -1}
                          onChange={(e) => update("web_ui_session_timeout", parseInt(e.target.value, 10) ?? -1)}
                          className="mt-1.5 input-macos w-24 text-label font-mono"
                          placeholder="-1 = unlimited"
                        />
                      </SettingsField>
                      <div className="my-6 border-t border-border" />
                      <h3 className="text-base font-semibold mb-4 text-foreground">Change Password</h3>
                      <SettingsField id="new-password" label="New Password">
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-1.5 input-macos w-full text-label"
                          placeholder="Enter new password"
                        />
                      </SettingsField>
                      <SettingsField id="confirm-password" label="Confirm Password">
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-1.5 input-macos w-full text-label"
                          placeholder="Confirm new password"
                        />
                      </SettingsField>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          type="button"
                          onClick={handleChangePassword}
                          disabled={passwordChanging || !newPassword || !confirmPassword}
                          className="toolbar-btn-group h-9 px-4 text-label disabled:opacity-50"
                        >
                          {passwordChanging ? "Changing..." : "Change Password"}
                        </button>
                        {passwordSuccess && (
                          <span className="text-body-sm text-success flex items-center gap-1.5">
                            <WhiteSurIcon name="check-symbolic" size={14} className="h-3.5 w-3.5" />
                            Password changed successfully
                          </span>
                        )}
                      </div>
                    </>
                  )}
                  </>
                  )}
                  {/* Spacer for footer overlay */}
                  <div className="settings-content-bottom-spacer" aria-hidden />
                  </div>
                </ScrollArea>
              </div>
            </>
        </div>
      </DialogContent>
    </Dialog>
  )
}
