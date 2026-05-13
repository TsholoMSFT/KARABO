/**
 * BlueprintAgentRunner
 * ----------------------------------------------------------------------------
 * Autopilot-mode UI that drives the Foundry Blueprint Copilot agent end-to-end.
 * Replaces the suggestion rail when AI mode is 'autopilot' AND the agent has
 * been provisioned successfully.
 *
 * Flow:
 *   1. Provision agent on first mount (cached server-side).
 *   2. POST /api/agent-run?mode=create with the customer brief.
 *   3. Poll every 2.5s; render assistant messages incrementally.
 *   4. When the agent calls request_human_input we show an inline prompt and
 *      send the operator's reply via /api/agent-run?mode=send.
 */

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Robot, Warning, PaperPlaneTilt } from '@phosphor-icons/react'
import { marked } from 'marked'
import {
  provisionAgent,
  createRun,
  pollRun,
  sendMessage,
  type AgentRunMessage,
} from '@/lib/agent-client'

interface Props {
  customerName: string
  customerId: string
  estateNotes?: string
  groundingNote?: string
  onClose?: () => void
}

const POLL_MS = 2500
const TERMINAL = ['completed', 'failed', 'cancelled', 'expired'] as const

export function BlueprintAgentRunner({ customerName, customerId, estateNotes, groundingNote, onClose }: Props) {
  const [agentId, setAgentId] = useState<string | null>(null)
  const [notConfigured, setNotConfigured] = useState<{ message: string; requiredEnv?: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [runId, setRunId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('idle')
  const [messages, setMessages] = useState<AgentRunMessage[]>([])
  const [pendingHuman, setPendingHuman] = useState<{ question: string; options?: string[] } | null>(null)
  const [humanReply, setHumanReply] = useState('')
  const pollTimer = useRef<number | null>(null)
  const startedFor = useRef<string | null>(null)

  // ── Boot: provision + create run ────────────────────────────
  useEffect(() => {
    if (startedFor.current === customerId) return
    startedFor.current = customerId
    setError(null); setNotConfigured(null); setMessages([]); setPendingHuman(null); setStatus('provisioning')
    ;(async () => {
      try {
        const prov = await provisionAgent()
        if (!prov.configured) {
          setNotConfigured({ message: prov.message || 'Foundry agent not configured', requiredEnv: prov.requiredEnv })
          setStatus('not-configured')
          return
        }
        setAgentId(prov.agentId || null)
        const initial = `Customer: ${customerName}\n\nEstate notes:\n${(estateNotes || '(empty)').slice(0, 2000)}\n\nGrounded signals:\n${(groundingNote || '(none — call IQ tools first)').slice(0, 2000)}\n\nProduce: situational analysis → 3 starter use cases → archetype + cost for the top one → executive brief.`
        const created = await createRun(initial)
        if (!created.configured || !created.threadId || !created.runId) {
          setError(created.error || created.message || 'Failed to start agent run')
          setStatus('failed')
          return
        }
        setThreadId(created.threadId); setRunId(created.runId); setStatus(created.status || 'in_progress')
      } catch (err: any) {
        setError(err?.message || String(err)); setStatus('failed')
      }
    })()
  }, [customerId, customerName, estateNotes, groundingNote])

  // ── Polling loop ────────────────────────────────────────────
  useEffect(() => {
    if (!threadId || !runId) return
    if ((TERMINAL as readonly string[]).includes(status)) return
    if (pendingHuman) return // wait for operator
    const tick = async () => {
      try {
        const data = await pollRun(threadId, runId)
        setStatus(data.status)
        if (data.messages?.length) setMessages(data.messages)
        if (data.pendingTool) setPendingHuman(data.pendingTool)
        if (data.error) setError(data.error)
      } catch (err: any) {
        setError(err?.message || String(err))
      }
    }
    pollTimer.current = window.setTimeout(tick, POLL_MS)
    return () => { if (pollTimer.current) window.clearTimeout(pollTimer.current) }
  }, [threadId, runId, status, messages.length, pendingHuman])

  const submitHumanReply = async () => {
    if (!threadId || !humanReply.trim()) return
    const reply = humanReply.trim()
    setPendingHuman(null); setHumanReply(''); setStatus('in_progress')
    try {
      const res = await sendMessage(threadId, reply)
      if (res.runId) setRunId(res.runId)
      if (res.status) setStatus(res.status)
    } catch (err: any) {
      setError(err?.message || String(err))
    }
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <Card className="border-2 border-primary/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Robot size={16} weight="duotone" className="text-primary" />
            Blueprint Autopilot
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{status}</Badge>
            {onClose && <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={onClose}>Stop</Button>}
          </div>
        </div>
        <CardDescription className="text-[11px]">Foundry agent for {customerName}{agentId ? ` · ${agentId.slice(0, 8)}` : ''}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notConfigured && (
          <div className="text-[11px] rounded border border-amber-500/40 bg-amber-500/10 p-2 space-y-1">
            <div className="flex items-center gap-1 font-semibold"><Warning size={12} weight="fill" /> Foundry agent not configured</div>
            <div className="text-muted-foreground">{notConfigured.message}</div>
            {notConfigured.requiredEnv?.length ? (
              <ul className="list-disc pl-4">
                {notConfigured.requiredEnv.map((e) => <li key={e}><code>{e}</code></li>)}
              </ul>
            ) : null}
          </div>
        )}
        {error && (
          <div className="text-[11px] rounded border border-rose-500/40 bg-rose-500/10 p-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}
        <ScrollArea className="h-[360px] pr-2">
          <div className="space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`text-[12px] rounded p-2 ${m.role === 'user' ? 'bg-muted' : 'bg-primary/5 border border-primary/20'}`}>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{m.role}</div>
                <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: marked.parse(m.content) as string }} />
              </div>
            ))}
            {!messages.length && status !== 'failed' && status !== 'not-configured' && (
              <div className="text-[11px] text-muted-foreground">Agent is gathering signals…</div>
            )}
          </div>
        </ScrollArea>
        {pendingHuman && (
          <div className="rounded border border-primary/40 bg-primary/5 p-2 space-y-2">
            <div className="text-[12px] font-semibold">Agent needs your input</div>
            <div className="text-[12px]">{pendingHuman.question}</div>
            {pendingHuman.options?.length ? (
              <div className="flex flex-wrap gap-1">
                {pendingHuman.options.map((o) => (
                  <Button key={o} size="sm" variant="outline" className="h-6 text-[11px]" onClick={() => { setHumanReply(o); void submitHumanReply() }}>{o}</Button>
                ))}
              </div>
            ) : null}
            <div className="flex items-center gap-1">
              <Input value={humanReply} onChange={(e) => setHumanReply(e.target.value)} placeholder="Your reply…" className="h-7 text-[12px]" />
              <Button size="sm" className="h-7 text-[11px]" onClick={submitHumanReply} disabled={!humanReply.trim()}>
                <PaperPlaneTilt size={12} className="mr-1" /> Send
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
