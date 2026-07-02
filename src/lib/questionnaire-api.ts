/**
 * Frontend client for the customer self-serve questionnaire API.
 * Mirrors the contract in src/lib/questionnaire-types.ts.
 */
import type {
  QuestionnaireLinkConfig,
  QuestionnaireLinkPublic,
  QuestionnaireCreateResult,
  QuestionnaireSubmitRequest,
  QuestionnaireSubmission,
  QuestionnaireStatus,
} from './questionnaire-types'

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/api'

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return (body && typeof body.error === 'string' && body.error) || fallback
  } catch {
    return fallback
  }
}

/** Consultant: create a shareable questionnaire link. */
export async function createQuestionnaireLink(
  config: QuestionnaireLinkConfig,
): Promise<QuestionnaireCreateResult> {
  const res = await fetch(`${API_ENDPOINT}/questionnaire`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to create questionnaire link.'))
  return res.json() as Promise<QuestionnaireCreateResult>
}

/** Customer: fetch the public questionnaire config by link token. */
export async function getQuestionnaire(token: string): Promise<QuestionnaireLinkPublic> {
  const res = await fetch(`${API_ENDPOINT}/questionnaire/${encodeURIComponent(token)}`)
  if (res.status === 404) throw new QuestionnaireError('not-found', 'This questionnaire link was not found.')
  if (res.status === 410) throw new QuestionnaireError('expired', 'This questionnaire link has expired.')
  if (!res.ok) throw new QuestionnaireError('error', await parseError(res, 'Failed to load the questionnaire.'))
  return res.json() as Promise<QuestionnaireLinkPublic>
}

/** Customer: submit completed answers. */
export async function submitQuestionnaire(
  token: string,
  payload: QuestionnaireSubmitRequest,
): Promise<{ ok: boolean; id: string }> {
  const res = await fetch(`${API_ENDPOINT}/questionnaire/${encodeURIComponent(token)}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to submit your responses.'))
  return res.json() as Promise<{ ok: boolean; id: string }>
}

/** Consultant: retrieve submissions using the private admin token. */
export async function getQuestionnaireResponses(
  token: string,
  adminToken: string,
): Promise<{ status: QuestionnaireStatus; submissionCount: number; submissions: QuestionnaireSubmission[] }> {
  const res = await fetch(`${API_ENDPOINT}/questionnaire/${encodeURIComponent(token)}/responses`, {
    headers: { 'x-admin-token': adminToken },
  })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to retrieve responses.'))
  return res.json()
}

export type QuestionnaireErrorKind = 'not-found' | 'expired' | 'error'

/** Typed error so the customer surface can render distinct states. */
export class QuestionnaireError extends Error {
  kind: QuestionnaireErrorKind
  constructor(kind: QuestionnaireErrorKind, message: string) {
    super(message)
    this.name = 'QuestionnaireError'
    this.kind = kind
  }
}
