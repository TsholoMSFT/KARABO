import { useLocalStorage } from './use-local-storage'
import type { Engagement, EngagementArtifact } from '@/lib/types'

/**
 * Persistent store for in-app customer engagements and their generated
 * artifacts (agenda, follow-up email, timeline, closeout, diagram, journey).
 * Mirrors the use-discovery / use-customers hooks.
 */
export function useEngagements() {
  const [engagements, setEngagements] = useLocalStorage<Engagement[]>('engagements', [])

  const addEngagement = (engagement: Engagement) =>
    setEngagements((prev) => [...(prev || []), engagement])

  const updateEngagement = (id: string, updates: Partial<Engagement>) =>
    setEngagements((prev) =>
      (prev || []).map((e) => (e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e)))

  const deleteEngagement = (id: string) =>
    setEngagements((prev) => (prev || []).filter((e) => e.id !== id))

  const getEngagementById = (id: string): Engagement | undefined =>
    (engagements || []).find((e) => e.id === id)

  /** Insert or replace an artifact on an engagement (keyed by artifact id). */
  const saveArtifact = (engagementId: string, artifact: EngagementArtifact) =>
    setEngagements((prev) =>
      (prev || []).map((e) => {
        if (e.id !== engagementId) return e
        const existing = e.artifacts ?? []
        const artifacts = existing.some((a) => a.id === artifact.id)
          ? existing.map((a) => (a.id === artifact.id ? { ...artifact, updatedAt: Date.now() } : a))
          : [...existing, artifact]
        return { ...e, artifacts, updatedAt: Date.now() }
      }))

  const deleteArtifact = (engagementId: string, artifactId: string) =>
    setEngagements((prev) =>
      (prev || []).map((e) =>
        e.id === engagementId
          ? { ...e, artifacts: (e.artifacts ?? []).filter((a) => a.id !== artifactId), updatedAt: Date.now() }
          : e))

  return {
    engagements: engagements || [],
    addEngagement,
    updateEngagement,
    deleteEngagement,
    getEngagementById,
    saveArtifact,
    deleteArtifact,
  }
}
