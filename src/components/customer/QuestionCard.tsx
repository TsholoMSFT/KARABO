/**
 * Lean, presentational question card for the customer self-serve surface.
 * Supports `text` and `ranking` input types. NO AI features (hints/follow-ups)
 * — the customer surface is intentionally quiet and unauthenticated.
 */
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DiscoveryQuestion } from '@/lib/types'

export interface AnswerState {
  answer: string
  ranking?: Record<string, number>
  comment?: string
}

interface QuestionCardProps {
  question: DiscoveryQuestion
  value: AnswerState
  onChange: (next: AnswerState) => void
}

function rankingToAnswer(ranking: Record<string, number>, comment?: string): string {
  const ordered = Object.entries(ranking)
    .filter(([, rank]) => typeof rank === 'number')
    .sort((a, b) => a[1] - b[1])
    .map(([item, rank]) => `${rank}. ${item}`)
  const base = ordered.join('\n')
  return comment?.trim() ? `${base}${base ? '\n\n' : ''}Notes: ${comment.trim()}` : base
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  if (question.inputType === 'ranking' && question.rankingItems?.length) {
    const items = question.rankingItems
    const ranking = value.ranking ?? {}
    const setRank = (item: string, rank: number) => {
      const next = { ...ranking, [item]: rank }
      onChange({ ...value, ranking: next, answer: rankingToAnswer(next, value.comment) })
    }
    return (
      <div className="space-y-5">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <Select
                value={ranking[item] ? String(ranking[item]) : undefined}
                onValueChange={(v) => setRank(item, Number(v))}
              >
                <SelectTrigger className="w-20 shrink-0">
                  <SelectValue placeholder="–" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((_, idx) => (
                    <SelectItem key={idx + 1} value={String(idx + 1)}>
                      {idx + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Comments / context (optional)</Label>
          <Textarea
            value={value.comment ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                comment: e.target.value,
                answer: rankingToAnswer(ranking, e.target.value),
              })
            }
            placeholder={question.placeholder}
            className="min-h-[100px] resize-none text-base"
          />
        </div>
      </div>
    )
  }

  return (
    <Textarea
      value={value.answer}
      onChange={(e) => onChange({ ...value, answer: e.target.value })}
      placeholder={question.placeholder}
      className="min-h-[180px] resize-none text-base"
      autoFocus
    />
  )
}
