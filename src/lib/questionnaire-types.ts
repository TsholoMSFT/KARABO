/**
 * Customer self-serve Discovery questionnaire — shared types.
 *
 * This is a leaf module: it imports from both `./types` and `./discovery-questions`
 * to avoid a circular dependency (discovery-questions.ts already imports types.ts).
 *
 * The JSON shapes here form the contract with the backend Azure Functions
 * (api/src/lib/questionnaire-store.ts). Keep both sides in sync.
 */
import type { DiscoveryQuestion, DiscoveryResponse, Industry, BusinessFunction } from './types'
import type { DiscoveryTrack } from './discovery-questions'

/** Lifecycle status of a shared questionnaire link. */
export type QuestionnaireStatus = 'pending' | 'completed' | 'expired'

/**
 * What the consultant configures when generating a link. Stored server-side and
 * returned to the customer surface (public — contains NO tokens or submissions).
 * `questions` is a snapshot so the customer and consultant always agree on the
 * exact question set / ids, regardless of how `getQuestionsForIndustry` evolves.
 */
export interface QuestionnaireLinkConfig {
  customerName: string
  industry: Industry
  track: DiscoveryTrack
  businessFunctions?: BusinessFunction[]
  /** Snapshot of the scoped questions the customer will answer. */
  questions: DiscoveryQuestion[]
  /** Optional custom welcome message shown to the customer. */
  introMessage?: string
  /** Optional epoch-ms expiry. After this, the link returns HTTP 410. */
  expiresAt?: number
  /** Optional free-text identifier for who created the link (audit only). */
  createdBy?: string
}

/**
 * Public view of a link, returned by `GET /api/questionnaire/{token}`.
 * Never includes the adminToken or any submissions.
 */
export interface QuestionnaireLinkPublic {
  token: string
  config: QuestionnaireLinkConfig
  status: QuestionnaireStatus
}

/** Result of `POST /api/questionnaire` (consultant create). */
export interface QuestionnaireCreateResult {
  linkToken: string
  adminToken: string
  /** Absolute customer URL, e.g. https://host/q/<linkToken>. */
  url: string
}

/** A single customer submission against a link. */
export interface QuestionnaireSubmission {
  id: string
  email: string
  primaryStakeholder?: string
  businessFunction?: BusinessFunction
  /** Company name as confirmed/edited by the customer. */
  companyName?: string
  responses: DiscoveryResponse[]
  submittedAt: number
}

/** Body of `POST /api/questionnaire/{token}/submit`. */
export interface QuestionnaireSubmitRequest {
  email: string
  primaryStakeholder?: string
  businessFunction?: BusinessFunction
  companyName?: string
  responses: DiscoveryResponse[]
}

/**
 * The consultant's locally-persisted record of a link they created
 * (localStorage key `questionnaire-links`). Holds the private adminToken used
 * to retrieve submissions.
 */
export interface QuestionnaireLink {
  linkToken: string
  adminToken: string
  url: string
  config: QuestionnaireLinkConfig
  status: QuestionnaireStatus
  createdAt: number
  submissionCount?: number
  lastRetrievedAt?: number
}
