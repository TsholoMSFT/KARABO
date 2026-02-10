/**
 * Prompt injection guard.
 *
 * Strips obvious prompt-override patterns from user-supplied text
 * before it is interpolated into an LLM prompt. This is **not** a
 * silver bullet (no regex filter ever is), but it raises the bar
 * significantly against low-sophistication injection attacks.
 *
 * Patterns stripped:
 * - "Ignore all previous instructions…"
 * - "You are now …" / "Act as …" role overrides
 * - System/assistant role markers ("SYSTEM:", "[INST]", etc.)
 * - Code fences that might smuggle hidden instructions
 * - Excessive newlines used to push context out of the window
 */

// Patterns ordered roughly from most dangerous to least.
const INJECTION_PATTERNS: RegExp[] = [
  // "Ignore previous instructions" family
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|context)/gi,
  // Role overrides
  /(?:^|\n)\s*(?:you\s+are\s+now|act\s+as|pretend\s+(?:to\s+be|you\s+are)|from\s+now\s+on\s+you\s+are)\b/gi,
  // System / assistant markers that could trick a naive parser
  /(?:^|\n)\s*(?:SYSTEM|ASSISTANT|HUMAN|USER)\s*:/gi,
  // Llama-style control tokens
  /\[INST\]|\[\/INST\]|<<SYS>>|<\|im_start\|>|<\|im_end\|>/gi,
  // Markdown code fences that might hide instructions
  /```(?:system|assistant|instructions?)\b[\s\S]*?```/gi,
]

/**
 * Strip injection patterns from a string.
 * Returns the cleaned string.
 */
export function sanitizePromptInput(text: string): string {
  let cleaned = text

  for (const pattern of INJECTION_PATTERNS) {
    // Reset lastIndex in case the regex was previously used
    pattern.lastIndex = 0
    cleaned = cleaned.replace(pattern, ' ')
  }

  // Collapse excessive newlines (>3) to prevent context-window displacement
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n')

  return cleaned.trim()
}

/**
 * Convenience: sanitize an object's string values (shallow).
 * Useful for cleaning session metadata before prompt interpolation.
 */
export function sanitizeRecord(rec: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(rec)) {
    out[key] = typeof value === 'string' ? sanitizePromptInput(value) : value
  }
  return out
}
