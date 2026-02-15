"use client"

import React, { createContext, useContext, useState, useRef, useCallback, useMemo, useEffect } from "react"
import useSWR from "swr"
import type { Torrent, TransferInfo, Category, SidebarFilter, SortField, SortDirection } from "./types"
import {
  fetchTorrents,
  fetchTransferInfo,
  fetchCategories,
  pauseTorrents as apiPauseTorrents,
  resumeTorrents as apiResumeTorrents,
  deleteTorrents as apiDeleteTorrents,
  addTorrentUrl,
  addTorrentFile,
  setSpeedLimitsMode,
} from "./api"

const torrentsFetcher = () => fetchTorrents()
const transferFetcher = () => fetchTransferInfo()
const categoriesFetcher = () => fetchCategories()

const defaultTransferInfo: TransferInfo = {
  dl_info_speed: 0,
  dl_info_data: 0,
  up_info_speed: 0,
  up_info_data: 0,
  dl_rate_limit: 0,
  up_rate_limit: 0,
  dht_nodes: 0,
  connection_status: "disconnected",
  free_space_on_disk: 0,
  use_alt_speed_limits: false,
}

interface TorrentStore {
  torrents: Torrent[]
  transferInfo: TransferInfo
  categories: Category[]
  isLoading: boolean
  error: Error | null
  mutate: () => void
  selectedTorrentHashes: Set<string>
  selectTorrent: (hash: string, index: number, ctrlKey: boolean, shiftKey: boolean, orderedHashes: string[]) => void
  clearSelection: () => void
  sidebarFilter: SidebarFilter
  setSidebarFilter: (filter: SidebarFilter) => void
  selectedCategory: string | null
  setSelectedCategory: (category: string | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortField: SortField
  setSortField: (field: SortField) => void
  sortDirection: SortDirection
  setSortDirection: (direction: SortDirection) => void
  filteredTorrents: Torrent[]
  pauseTorrents: (hashes: string[]) => Promise<void>
  resumeTorrents: (hashes: string[]) => Promise<void>
  deleteTorrents: (hashes: string[], deleteFiles: boolean) => Promise<void>
  toggleSpeedLimitsMode: () => Promise<void>
  addTorrent: (urls: string, category?: string, savePath?: string, paused?: boolean) => Promise<void>
  addTorrentFromFile: (file: File, category?: string, savePath?: string, paused?: boolean) => Promise<void>
  selectedTorrent: Torrent | null
  showDetailPanel: boolean
  setShowDetailPanel: (show: boolean) => void
  detailPanelHeight: number
  setDetailPanelHeight: (h: number) => void
  isDesktop: boolean
}

const DETAIL_PANEL_HEIGHT_KEY = "detailPanelHeight"
const DEFAULT_DETAIL_HEIGHT = 340

function loadDetailPanelHeight(): number {
  if (typeof window === "undefined") return DEFAULT_DETAIL_HEIGHT
  const v = localStorage.getItem(DETAIL_PANEL_HEIGHT_KEY)
  const n = v ? parseInt(v, 10) : NaN
  return Number.isFinite(n) && n >= 280 && n <= 600 ? n : DEFAULT_DETAIL_HEIGHT
}

const TorrentContext = createContext<TorrentStore | null>(null)

export function TorrentProvider({ children }: { children: React.ReactNode }) {
  const [detailPanelHeight, setDetailPanelHeightState] = useState(() => loadDetailPanelHeight())

  const setDetailPanelHeight = useCallback((h: number) => {
    const clamped = Math.max(120, Math.min(600, h))
    setDetailPanelHeightState(clamped)
    localStorage.setItem(DETAIL_PANEL_HEIGHT_KEY, String(clamped))
  }, [])

  const [selectedTorrentHashes, setSelectedTorrentHashes] = useState<Set<string>>(new Set())
  const [primaryTorrentHash, setPrimaryTorrentHash] = useState<string | null>(null)
  const lastClickedIndexRef = useRef<number>(-1)
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>("all")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("added_on")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
  )
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const onChange = () => setIsDesktop(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const {
    data: torrents = [],
    error: torrentsError,
    isLoading: torrentsLoading,
    mutate: mutateTorrents,
  } = useSWR<Torrent[]>("torrents", torrentsFetcher, { 
    refreshInterval: 2000,
    shouldRetryOnError: false,
    errorRetryCount: 2,
  })

  const {
    data: transferInfo = defaultTransferInfo,
    error: transferError,
    isLoading: transferLoading,
    mutate: mutateTransfer,
  } = useSWR<TransferInfo>("transfer", transferFetcher, { 
    refreshInterval: 2000,
    shouldRetryOnError: false,
    errorRetryCount: 2,
  })

  const {
    data: rawCategories = [],
    mutate: mutateCategories,
  } = useSWR<Category[]>("categories", categoriesFetcher)

  const categories = useMemo(() => {
    const withCount = rawCategories.map((cat) => ({
      ...cat,
      count: torrents.filter((t) => (t.category || "").trim() === (cat.name || "").trim()).length,
    }))
    const uncategorizedCount = torrents.filter((t) => !(t.category || "").trim()).length
    if (uncategorizedCount > 0 && !rawCategories.some((c) => (c.name || "").trim() === "")) {
      withCount.push({ name: "", savePath: "", count: uncategorizedCount })
    }
    return withCount
  }, [rawCategories, torrents])

  const error = torrentsError ?? transferError
  const isLoading = torrentsLoading || transferLoading

  const mutate = useCallback(() => {
    mutateTorrents()
    mutateTransfer()
    mutateCategories()
  }, [mutateTorrents, mutateTransfer, mutateCategories])

  // Revalidate immediately when user logs in (SWR may have cached 401 from before login)
  useEffect(() => {
    const onLogin = () => {
      mutateTorrents()
      mutateTransfer()
      mutateCategories()
    }
    window.addEventListener("qbt-login-success", onLogin)
    return () => window.removeEventListener("qbt-login-success", onLogin)
  }, [mutateTorrents, mutateTransfer, mutateCategories])

  const filteredTorrents = useMemo(() => {
    let filtered = [...torrents]
    if (isDesktop && searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(q))
    }
    switch (sidebarFilter) {
      case "downloading":
        filtered = filtered.filter((t) => t.state === "downloading" || t.state === "metadata")
        break
      case "seeding":
        filtered = filtered.filter((t) => t.state === "seeding")
        break
      case "completed":
        filtered = filtered.filter((t) => t.progress >= 1)
        break
      case "paused":
        filtered = filtered.filter((t) => t.state === "paused")
        break
      case "active":
        filtered = filtered.filter((t) => t.dlspeed > 0 || t.upspeed > 0)
        break
      case "inactive":
        filtered = filtered.filter((t) => t.dlspeed === 0 && t.upspeed === 0)
        break
      case "errored":
        filtered = filtered.filter((t) => t.state === "error" || t.state === "stalled")
        break
    }
    if (selectedCategory !== null) {
      const cat = selectedCategory === "" ? "" : selectedCategory
      filtered = filtered.filter((t) => (t.category || "").trim() === cat)
    }
    filtered.sort((a, b) => {
      const aVal = a[sortField as keyof Torrent]
      const bVal = b[sortField as keyof Torrent]
      if (aVal == null || bVal == null) return 0
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      const numA = Number(aVal)
      const numB = Number(bVal)
      return sortDirection === "asc" ? numA - numB : numB - numA
    })
    return filtered
  }, [torrents, searchQuery, sidebarFilter, selectedCategory, sortField, sortDirection, isDesktop])

  const selectTorrent = useCallback(
    (hash: string, index: number, ctrlKey: boolean, shiftKey: boolean, orderedHashes: string[]) => {
      const lastIdx = lastClickedIndexRef.current
      setSelectedTorrentHashes((prev) => {
        const next = new Set(prev)
        if (shiftKey && lastIdx >= 0) {
          const from = Math.min(lastIdx, index)
          const to = Math.max(lastIdx, index)
          for (let i = from; i <= to; i++) next.add(orderedHashes[i])
        } else if (ctrlKey) {
          if (next.has(hash)) next.delete(hash)
          else next.add(hash)
        } else {
          next.clear()
          next.add(hash)
        }
        return next
      })
      setPrimaryTorrentHash(hash)
      lastClickedIndexRef.current = index
    },
    []
  )

  const clearSelection = useCallback(() => {
    setSelectedTorrentHashes(new Set())
    setPrimaryTorrentHash(null)
    lastClickedIndexRef.current = -1
  }, [])

  const pauseTorrents = useCallback(async (hashes: string[]) => {
    await apiPauseTorrents(hashes)
    mutate()
  }, [mutate])

  const resumeTorrents = useCallback(async (hashes: string[]) => {
    await apiResumeTorrents(hashes)
    mutate()
  }, [mutate])

  const deleteTorrents = useCallback(async (hashes: string[], deleteFiles: boolean) => {
    await apiDeleteTorrents(hashes, deleteFiles)
    setSelectedTorrentHashes((prev) => {
      const next = new Set(prev)
      hashes.forEach((h) => next.delete(h))
      return next
    })
    if (primaryTorrentHash && hashes.includes(primaryTorrentHash)) {
      setPrimaryTorrentHash(null)
    }
    mutate()
  }, [mutate, primaryTorrentHash])

  const toggleSpeedLimitsMode = useCallback(async () => {
    const next = !transferInfo.use_alt_speed_limits
    mutateTransfer(
      { ...transferInfo, use_alt_speed_limits: next },
      { revalidate: false }
    )
    try {
      await setSpeedLimitsMode(next)
    } catch {
      mutateTransfer()
    }
    mutateTransfer()
  }, [transferInfo, mutateTransfer])

  const addTorrent = useCallback(async (urls: string, category?: string, savePath?: string, paused?: boolean) => {
    await addTorrentUrl(urls, { category: category || undefined, savepath: savePath, paused })
    mutate()
  }, [mutate])

  const addTorrentFromFile = useCallback(async (file: File, category?: string, savePath?: string, paused?: boolean) => {
    await addTorrentFile(file, { category: category || undefined, savepath: savePath, paused })
    mutate()
  }, [mutate])

  const selectedTorrent = useMemo(
    () => (primaryTorrentHash ? torrents.find((t) => t.hash === primaryTorrentHash) ?? null : null),
    [torrents, primaryTorrentHash]
  )

  const value: TorrentStore = {
    torrents,
    transferInfo,
    categories,
    isLoading,
    error: error ?? null,
    mutate,
    selectedTorrentHashes,
    selectTorrent,
    clearSelection,
    sidebarFilter,
    setSidebarFilter,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    filteredTorrents,
    pauseTorrents,
    resumeTorrents,
    deleteTorrents,
    toggleSpeedLimitsMode,
    addTorrent,
    addTorrentFromFile,
    selectedTorrent,
    showDetailPanel,
    setShowDetailPanel,
    detailPanelHeight,
    setDetailPanelHeight,
    isDesktop,
  }

  return <TorrentContext.Provider value={value}>{children}</TorrentContext.Provider>
}

export function useTorrentStore() {
  const ctx = useContext(TorrentContext)
  if (!ctx) throw new Error("useTorrentStore must be used within TorrentProvider")
  return ctx
}
