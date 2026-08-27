import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { flushOutbox, listFailed, pendingCount, subscribeOutbox, clearFailed } from '../lib/outbox'

const SyncContext = createContext(null)

export function SyncProvider({ children }) {
  const [online, setOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(pendingCount())
  const [failed, setFailed] = useState(listFailed().length)
  const [lastSyncAt, setLastSyncAt] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const flush = useCallback(async () => {
    setSyncing(true)
    try {
      const result = await flushOutbox()
      if (result.sent > 0) setLastSyncAt(Date.now())
      setPending(pendingCount())
      setFailed(listFailed().length)
      return result
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => subscribeOutbox((count) => setPending(count)), [])

  useEffect(() => {
    function goOnline() {
      setOnline(true)
      flush()
    }
    function goOffline() {
      setOnline(false)
    }
    function onVisible() {
      if (document.visibilityState === 'visible' && navigator.onLine) flush()
    }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    document.addEventListener('visibilitychange', onVisible)

    // Δίχτυ ασφαλείας: κάποια κινητά δεν στέλνουν πάντα το γεγονός 'online'.
    const timer = setInterval(() => {
      if (navigator.onLine && pendingCount() > 0) flush()
    }, 30000)

    flush()

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(timer)
    }
  }, [flush])

  const value = useMemo(
    () => ({
      online,
      pending,
      failed,
      syncing,
      lastSyncAt,
      flush,
      dismissFailed: () => {
        clearFailed()
        setFailed(0)
      },
    }),
    [online, pending, failed, syncing, lastSyncAt, flush],
  )

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSync() {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync εκτός SyncProvider')
  return ctx
}
