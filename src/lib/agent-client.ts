/**
 * Typed client for /api/agent-provision and /api/agent-run.
 * Used by the BlueprintAgentRunner (autopilot mode) to drive the Foundry
 * Blueprint Copilot agent and surface streaming-style updates via polling.
 */

const BASE = (typeof window !== "undefined" && (window as any).__API_BASE__) || ""

export interface AgentProvisionResponse {
  configured: boolean
  agentId?: string
  cached?: boolean
  message?: string
  requiredEnv?: string[]
  docsUrl?: string
  toolCount?: number
  model?: string
  error?: string
}

export interface AgentRunMessage {
  role: "user" | "assistant" | "system"
  content: string
  createdAt?: number
}

export interface AgentPollResponse {
  configured: boolean
  threadId?: string
  runId?: string
  status: "queued" | "in_progress" | "requires_action" | "completed" | "failed" | "cancelled" | "expired"
  pendingTool?: { question: string; options?: string[] }
  messages: AgentRunMessage[]
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  message?: string
  requiredEnv?: string[]
  error?: string
}

export interface AgentCreateResponse {
  configured: boolean
  threadId?: string
  runId?: string
  status?: string
  message?: string
  requiredEnv?: string[]
  error?: string
}

export async function provisionAgent(force = false): Promise<AgentProvisionResponse> {
  const res = await fetch(`${BASE}/api/agent-provision${force ? "?force=true" : ""}`, { method: "POST" })
  return (await res.json()) as AgentProvisionResponse
}

export async function createRun(initialMessage: string): Promise<AgentCreateResponse> {
  const res = await fetch(`${BASE}/api/agent-run?mode=create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initialMessage }),
  })
  return (await res.json()) as AgentCreateResponse
}

export async function sendMessage(threadId: string, message: string): Promise<AgentCreateResponse> {
  const res = await fetch(`${BASE}/api/agent-run?mode=send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, message }),
  })
  return (await res.json()) as AgentCreateResponse
}

export async function pollRun(threadId: string, runId: string): Promise<AgentPollResponse> {
  const res = await fetch(`${BASE}/api/agent-run?mode=poll&threadId=${encodeURIComponent(threadId)}&runId=${encodeURIComponent(runId)}`)
  return (await res.json()) as AgentPollResponse
}
