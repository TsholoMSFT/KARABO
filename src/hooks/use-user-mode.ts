import { useLocalStorage } from './use-local-storage'
import type { UserMode } from '@/lib/duce-types'

/**
 * Facilitator vs Participant mode for DUCE.
 * - facilitator: full access to scoring, override, decision engine internals
 * - participant: simplified guided UI; scoring + advanced steps hidden
 */
export function useUserMode() {
  const [mode, setMode] = useLocalStorage<UserMode>('duce-user-mode', 'facilitator')
  const isFacilitator = mode === 'facilitator'
  const isParticipant = mode === 'participant'
  return {
    mode: mode ?? 'facilitator',
    setMode,
    isFacilitator,
    isParticipant,
    toggle: () => setMode(isFacilitator ? 'participant' : 'facilitator'),
  }
}
