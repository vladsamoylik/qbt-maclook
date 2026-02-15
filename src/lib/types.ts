export type TorrentState =
  | "downloading"
  | "seeding"
  | "paused"
  | "queued"
  | "checking"
  | "error"
  | "completed"
  | "stalled"
  | "metadata"

export interface Torrent {
  hash: string
  name: string
  size: number
  progress: number
  dlspeed: number
  upspeed: number
  num_seeds: number
  num_leechs: number
  ratio: number
  eta: number
  state: TorrentState
  category: string
  tags: string[]
  added_on: number
  completion_on: number
  save_path: string
  total_downloaded: number
  total_uploaded: number
  availability: number
  priority: number
  tracker: string
  num_complete: number
  num_incomplete: number
  downloaded_session: number
  uploaded_session: number
}

export interface TorrentFile {
  index: number
  name: string
  size: number
  progress: number
  priority: number
  is_seed: boolean
  piece_range: number[]
  availability: number
}

export interface TorrentPeer {
  ip: string
  port: number
  client: string
  country: string
  flags: string
  dl_speed: number
  up_speed: number
  progress: number
  downloaded: number
  uploaded: number
  connection: string
}

export interface TorrentTracker {
  url: string
  status: number
  tier: number
  num_peers: number
  num_seeds: number
  num_leeches: number
  msg: string
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

export type SidebarFilter =
  | "all"
  | "downloading"
  | "seeding"
  | "completed"
  | "paused"
  | "active"
  | "inactive"
  | "errored"

export type SortField =
  | "name"
  | "size"
  | "progress"
  | "state"
  | "dlspeed"
  | "upspeed"
  | "eta"
  | "added_on"
  | "priority"
  | "num_seeds"
  | "num_leechs"

export type SortDirection = "asc" | "desc"
