/**
 * qBittorrent Web API v2 - direct calls (same-origin when used as Alternative Web UI)
 */

import type { Torrent, TorrentFile, TorrentPeer, TorrentState, TorrentTracker } from "./types"

const API_BASE = "/api/v2"

async function qbtFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}/${path}`, {
    ...options,
    credentials: "same-origin",
  })
}

async function qbtJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await qbtFetch(path, options)
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

export function mapState(apiState: string): TorrentState {
  const map: Record<string, string> = {
    error: "error",
    pausedUP: "paused",
    pausedDL: "paused",
    queuedUP: "queued",
    queuedDL: "queued",
    uploading: "seeding",
    stalledUP: "seeding",
    checkingUP: "checking",
    checkingDL: "checking",
    downloading: "downloading",
    stalledDL: "stalled",
    metaDL: "metadata",
    allocating: "downloading",
    moving: "downloading",
  }
  return (map[apiState] ?? "stalled") as TorrentState
}

export interface ApiTorrent {
  hash: string
  name: string
  size: number
  progress: number
  dlspeed: number
  upspeed: number
  num_seeds: number
  num_leechs: number
  num_complete: number
  num_incomplete: number
  ratio: number
  eta: number
  state: string
  category: string
  tags: string
  added_on: number
  completion_on: number
  save_path: string
  downloaded: number
  uploaded: number
  downloaded_session?: number
  uploaded_session?: number
  availability: number
  priority: number
  tracker?: string
}

export interface ApiTransferInfo {
  dl_info_speed: number
  dl_info_data: number
  up_info_speed: number
  up_info_data: number
  dl_rate_limit: number
  up_rate_limit: number
  dht_nodes: number
  connection_status: string
  free_space_on_disk?: number
  /** Alternative (reduced) speed limits mode - qBittorrent 4.1+ */
  use_alt_speed_limits?: boolean
}

export interface ApiCategory {
  name: string
  savePath: string
}

export interface TransferInfo {
  dl_info_speed: number
  dl_info_data: number
  up_info_speed: number
  up_info_data: number
  dl_rate_limit: number
  up_rate_limit: number
  dht_nodes: number
  connection_status: "connected" | "firewalled" | "disconnected"
  free_space_on_disk: number
  use_alt_speed_limits: boolean
}

export interface Category {
  name: string
  savePath: string
  count: number
}

function mapTorrent(api: ApiTorrent): Torrent {
  const tags = api.tags ? api.tags.split(", ").filter(Boolean) : []
  return {
    hash: api.hash,
    name: api.name,
    size: api.size,
    progress: api.progress,
    dlspeed: api.dlspeed,
    upspeed: api.upspeed,
    num_seeds: api.num_seeds,
    num_leechs: api.num_leechs,
    ratio: api.ratio,
    eta: api.eta,
    state: mapState(api.state),
    category: api.category ?? "",
    tags,
    added_on: api.added_on,
    completion_on: api.completion_on,
    save_path: api.save_path,
    total_downloaded: api.downloaded,
    total_uploaded: api.uploaded,
    availability: api.availability,
    priority: api.priority,
    tracker: api.tracker ?? "",
    num_complete: api.num_complete ?? 0,
    num_incomplete: api.num_incomplete ?? 0,
    downloaded_session: api.downloaded_session ?? 0,
    uploaded_session: api.uploaded_session ?? 0,
  }
}

export async function fetchTorrents(): Promise<Torrent[]> {
  const data = (await qbtJson<ApiTorrent[]>("torrents/info")).map(mapTorrent)
  return data
}

// sync/maindata returns free_space_on_disk in server_state (API v2.1.1+)
interface SyncMainData {
  rid?: number
  server_state?: { free_space_on_disk?: number }
}

function getFreeSpace(value: unknown): number {
  const n = Number(value)
  return typeof value === "number" && Number.isFinite(n) && n >= 0 ? n : -1
}

export async function fetchTransferInfo(): Promise<TransferInfo> {
  const [data, prefs] = await Promise.all([
    qbtJson<ApiTransferInfo>("transfer/info"),
    qbtJson<{ use_alt_speed_limits?: boolean; alt_speed_enabled?: boolean }>("app/preferences").catch(
      (): { use_alt_speed_limits?: boolean; alt_speed_enabled?: boolean } => ({}),
    ),
  ])
  let free = getFreeSpace(data.free_space_on_disk)
  if (free < 0) {
    try {
      const sync = await qbtJson<SyncMainData>("sync/maindata", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "rid=0",
      })
      free = getFreeSpace(sync.server_state?.free_space_on_disk)
    } catch {
      /* ignore */
    }
  }
  const useAlt =
    data.use_alt_speed_limits ?? prefs.use_alt_speed_limits ?? prefs.alt_speed_enabled ?? false
  return {
    ...data,
    connection_status: data.connection_status as TransferInfo["connection_status"],
    free_space_on_disk: free >= 0 ? free : 0,
    use_alt_speed_limits: Boolean(useAlt),
  }
}

/** Set alternative speed limits mode (reduced global rate limits). */
export async function setSpeedLimitsMode(intendedState: boolean): Promise<void> {
  const body = new URLSearchParams({
    intended_state: intendedState ? "1" : "0",
  }).toString()
  const res = await qbtFetch("transfer/setSpeedLimitsMode", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await qbtJson<Record<string, ApiCategory>>("torrents/categories")
  return Object.entries(data).map(([name, cat]) => ({
    name,
    savePath: cat.savePath,
    count: 0,
  }))
}

// Application preferences - subset of fields from GET /api/v2/app/preferences
export interface AppPreferences {
  save_path: string
  temp_path: string
  temp_path_enabled: boolean
  preallocate_all: boolean
  create_subfolder_enabled: boolean
  start_paused_enabled: boolean
  incomplete_files_ext: boolean
  export_dir: string
  export_dir_fin: string
  listen_port: number
  upnp: boolean
  random_port: boolean
  dl_limit: number
  up_limit: number
  max_connec: number
  max_connec_per_torrent: number
  max_uploads: number
  max_uploads_per_torrent: number
  limit_lan_peers: boolean
  queueing_enabled: boolean
  max_active_downloads: number
  max_active_uploads: number
  max_active_torrents: number
  dont_count_slow_torrents: boolean
  slow_torrent_dl_rate_threshold: number
  slow_torrent_ul_rate_threshold: number
  slow_torrent_inactive_timer: number
  alt_dl_limit: number
  alt_up_limit: number
  scheduler_enabled: boolean
  schedule_from_hour: number
  schedule_from_min: number
  schedule_to_hour: number
  schedule_to_min: number
  scheduler_days: number
  proxy_type: number
  proxy_ip: string
  proxy_port: number
  proxy_auth_enabled: boolean
  proxy_username: string
  proxy_password: string
  ip_filter_enabled: boolean
  ip_filter_path: string
  dht: boolean
  pex: boolean
  lsd: boolean
  encryption: number
  anonymous_mode: boolean
  bittorrent_protocol: number
  max_ratio_enabled: boolean
  max_ratio: number
  max_ratio_act: number
  max_seeding_time_enabled: boolean
  max_seeding_time: number
  add_trackers_enabled: boolean
  add_trackers: string
  autorun_enabled: boolean
  autorun_program: string
  web_ui_port: number
  web_ui_username: string
  web_ui_password: string
  bypass_local_auth: boolean
  bypass_auth_subnet_whitelist_enabled: boolean
  bypass_auth_subnet_whitelist: string
  web_ui_max_auth_fail_count: number
  web_ui_ban_duration: number
  web_ui_session_timeout: number
  locale: string
  alternative_webui_enabled: boolean
  alternative_webui_path: string
  auto_tmm_enabled: boolean
  torrent_changed_tmm_enabled: boolean
  save_path_changed_tmm_enabled: boolean
  category_changed_tmm_enabled: boolean
  alt_speed_enabled?: boolean
}

export async function fetchAppPreferences(): Promise<Partial<AppPreferences>> {
  return qbtJson("app/preferences")
}

export async function setAppPreferences(prefs: Partial<AppPreferences>): Promise<void> {
  const body = new URLSearchParams({
    json: JSON.stringify(prefs),
  })
  const res = await qbtFetch("app/setPreferences", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function changePassword(newPassword: string): Promise<void> {
  await setAppPreferences({ web_ui_password: newPassword })
}

export async function login(username: string, password: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": window.location.origin,
      },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      credentials: "same-origin",
    })
    
    if (res.status === 403) {
      throw new Error("IP banned for too many failed login attempts")
    }
    
    const text = await res.text()
    // qBittorrent returns "Ok." on success, "Fails." on wrong credentials
    return text.trim() === "Ok."
  } catch (e) {
    console.error("Login fetch failed:", e)
    throw e
  }
}

export async function logout(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: {
        "Referer": window.location.origin,
      },
      credentials: "same-origin",
    })
    await res.text()
  } catch (e) {
    console.error("Logout request failed:", e)
    // Don't throw - proceed with page reload anyway
  }
}

export async function pauseTorrents(hashes: string[]): Promise<void> {
  if (hashes.length === 0) return
  const body = new URLSearchParams({ hashes: hashes.join("|") })
  const res = await qbtFetch("torrents/pause", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function resumeTorrents(hashes: string[]): Promise<void> {
  if (hashes.length === 0) return
  const body = new URLSearchParams({ hashes: hashes.join("|") })
  const res = await qbtFetch("torrents/resume", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function deleteTorrent(hash: string, deleteFiles: boolean): Promise<void> {
  return deleteTorrents([hash], deleteFiles)
}

export async function deleteTorrents(hashes: string[], deleteFiles: boolean): Promise<void> {
  if (hashes.length === 0) return
  const body = new URLSearchParams({
    hashes: hashes.join("|"),
    deleteFiles: String(deleteFiles),
  })
  const res = await qbtFetch("torrents/delete", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function addTorrentUrl(
  urls: string,
  options?: { category?: string; savepath?: string; paused?: boolean }
): Promise<void> {
  const form = new URLSearchParams({ urls })
  if (options?.category) form.set("category", options.category)
  if (options?.savepath) form.set("savepath", options.savepath)
  if (options?.paused !== undefined) form.set("paused", String(options.paused))
  const res = await qbtFetch("torrents/add", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function fetchTorrentFiles(hash: string): Promise<TorrentFile[]> {
  return qbtJson<TorrentFile[]>(`torrents/files?hash=${hash}`)
}

export async function fetchTorrentPeers(hash: string): Promise<TorrentPeer[]> {
  return qbtJson<TorrentPeer[]>(`torrents/peers?hash=${hash}`)
}

export async function fetchTorrentTrackers(hash: string): Promise<TorrentTracker[]> {
  return qbtJson<TorrentTracker[]>(`torrents/trackers?hash=${hash}`)
}

export async function addTorrentFile(
  file: File,
  options?: { category?: string; savepath?: string; paused?: boolean }
): Promise<void> {
  const form = new FormData()
  form.append("torrents", file)
  if (options?.category) form.append("category", options.category)
  if (options?.savepath) form.append("savepath", options.savepath)
  if (options?.paused !== undefined) form.append("paused", String(options.paused))
  const res = await qbtFetch("torrents/add", {
    method: "POST",
    body: form,
  })
  if (!res.ok) throw new Error(await res.text())
}
