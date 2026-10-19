import { useCallback, useState } from "react"

export type KdsViewMode = "list" | "kanban"

const STORAGE_KEY = "kds-view-mode"

function readStoredViewMode(): KdsViewMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "list" || stored === "kanban") {
      return stored
    }
  } catch {
    // ignore storage errors (private mode, etc.)
  }
  return "list"
}

export function usePersistedViewMode() {
  const [viewMode, setViewModeState] = useState<KdsViewMode>(readStoredViewMode)

  const setViewMode = useCallback((mode: KdsViewMode) => {
    setViewModeState(mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // ignore storage errors
    }
  }, [])

  return { viewMode, setViewMode }
}
