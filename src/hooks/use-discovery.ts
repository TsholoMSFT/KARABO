import { useLocalStorage } from './use-local-storage'
import { DiscoverySession } from '@/lib/types'

export function useDiscovery() {
  const [sessions, setSessions] = useLocalStorage<DiscoverySession[]>('discovery-sessions', [])

  const addSession = (session: DiscoverySession) => {
    setSessions([...(sessions || []), session])
  }

  const updateSession = (sessionId: string, updates: Partial<DiscoverySession>) => {
    setSessions((sessions || []).map((s) => s.id === sessionId ? { ...s, ...updates } : s))
  }

  const deleteSession = (sessionId: string) => {
    setSessions((sessions || []).filter((s) => s.id !== sessionId))
  }

  const getSessionById = (sessionId: string): DiscoverySession | undefined => {
    return (sessions || []).find((s) => s.id === sessionId)
  }

  const getLatestSession = (): DiscoverySession | undefined => {
    const allSessions = sessions || []
    if (allSessions.length === 0) return undefined
    return allSessions.sort((a, b) => b.createdAt - a.createdAt)[0]
  }

  const clearSessions = () => {
    setSessions([])
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
