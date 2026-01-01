import { useKV } from '@github/spark/hooks'
import { DiscoverySession } from '@/lib/types'

export function useDiscovery() {
  const [sessions, setSessions, deleteSessions] = useKV<DiscoverySession[]>('discovery-sessions', [])

  const addSession = (session: DiscoverySession) => {
    setSessions((current) => [...(current || []), session])
  }

  const updateSession = (sessionId: string, updates: Partial<DiscoverySession>) => {
    setSessions((current) => 
      (current || []).map((s) => s.id === sessionId ? { ...s, ...updates } : s)
    )
  }

  const deleteSession = (sessionId: string) => {
    setSessions((current) => (current || []).filter((s) => s.id !== sessionId))
  }

  const getSessionById = (sessionId: string): DiscoverySession | undefined => {
    const allSessions = sessions || []
    return allSessions.find((s) => s.id === sessionId)
  }

  const getLatestSession = (): DiscoverySession | undefined => {
    const allSessions = sessions || []
    if (allSessions.length === 0) return undefined
    return allSessions.sort((a, b) => b.createdAt - a.createdAt)[0]
  }

  const clearSessions = () => {
    deleteSessions()
  }

  return {
    sessions: sessions || [],
    addSession,
    updateSession,
    deleteSession,
    getSessionById,
    getLatestSession,
    clearSessions,
  }
}
