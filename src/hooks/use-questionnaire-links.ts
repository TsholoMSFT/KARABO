import { useLocalStorage } from './use-local-storage'
import type { QuestionnaireLink, QuestionnaireStatus } from '@/lib/questionnaire-types'

/**
 * Persistent store for consultant-created customer questionnaire links.
 * Holds the private adminToken used to retrieve submissions. Mirrors the
 * use-engagements / use-discovery hooks (localStorage key `questionnaire-links`).
 */
export function useQuestionnaireLinks() {
  const [links, setLinks] = useLocalStorage<QuestionnaireLink[]>('questionnaire-links', [])

  const addLink = (link: QuestionnaireLink) => setLinks((prev) => [link, ...(prev || [])])

  const updateLink = (linkToken: string, updates: Partial<QuestionnaireLink>) =>
    setLinks((prev) => (prev || []).map((l) => (l.linkToken === linkToken ? { ...l, ...updates } : l)))

  const deleteLink = (linkToken: string) =>
    setLinks((prev) => (prev || []).filter((l) => l.linkToken !== linkToken))

  const getLink = (linkToken: string): QuestionnaireLink | undefined =>
    (links || []).find((l) => l.linkToken === linkToken)

  const setStatus = (linkToken: string, status: QuestionnaireStatus) => updateLink(linkToken, { status })

  return {
    links: links || [],
    addLink,
    updateLink,
    deleteLink,
    getLink,
    setStatus,
  }
}
