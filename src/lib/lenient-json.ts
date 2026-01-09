/**
 * Lenient JSON parsing helpers for LLM outputs.
 * Best-effort repairs: code fences, trailing commas, smart quotes, unquoted keys.
 */

function stripCodeFences(text: string): string {
  const trimmed = text.trim()
  if (!trimmed.startsWith('```')) return trimmed
  return trimmed
    .replace(/^```[a-zA-Z0-9_-]*\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim()
}

function removeTrailingCommas(jsonLike: string): string {
  return jsonLike.replace(/,(\s*[}\]])/g, '$1')
}

function normalizeQuotes(jsonLike: string): string {
  return jsonLike
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
}

function quoteUnquotedKeys(jsonLike: string): string {
  // { foo: 1 } -> { "foo": 1 }
  return jsonLike.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
}

function convertSingleQuotedStrings(jsonLike: string): string {
  // Convert : 'string' -> : "string" (best-effort)
  return jsonLike.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_m, g1) => {
    const safe = String(g1).replace(/"/g, '\\"')
    return `: "${safe}"`
  })
}

function extractFirstJsonValue(text: string): string | null {
  const startObj = text.indexOf('{')
  const startArr = text.indexOf('[')
  const start =
    startObj === -1 ? startArr : startArr === -1 ? startObj : Math.min(startObj, startArr)

  if (start === -1) return null

  let inString = false
  let escape = false
  const stack: Array<'{' | '['> = []

  for (let i = start; i < text.length; i++) {
    const ch = text[i]

    if (inString) {
      if (escape) {
        escape = false
        continue
      }
      if (ch === '\\') {
        escape = true
        continue
      }
      if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === '{' || ch === '[') {
      stack.push(ch)
      continue
    }

    if (ch === '}' || ch === ']') {
      const last = stack.pop()
      if (!last) continue
      if (ch === '}' && last !== '{') continue
      if (ch === ']' && last !== '[') continue

      if (stack.length === 0) {
        return text.slice(start, i + 1)
      }
    }
  }

  return null
}

export function parseJsonLenient<T = unknown>(raw: string): T {
  const stripped = stripCodeFences(raw)

  try {
    return JSON.parse(stripped) as T
  } catch {
    // Continue
  }

  const extracted = extractFirstJsonValue(stripped)
  if (!extracted) {
    throw new Error('No JSON object/array found in AI response')
  }

  const candidates = [
    extracted,
    removeTrailingCommas(extracted),
    quoteUnquotedKeys(removeTrailingCommas(normalizeQuotes(extracted))),
    convertSingleQuotedStrings(quoteUnquotedKeys(removeTrailingCommas(normalizeQuotes(extracted)))),
  ]

  let lastError: unknown
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T
    } catch (err) {
      lastError = err
    }
  }

  const message = lastError instanceof Error ? lastError.message : 'Unknown JSON parse error'
  throw new Error(`Invalid JSON returned by AI: ${message}`)
}
