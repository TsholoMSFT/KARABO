/**
 * KPI Fuzzy Matching Utility
 * 
 * Matches imported KPI strings against the defined KPI library.
 * Uses fuzzy matching with configurable threshold.
 */

import { AVAILABLE_KPIS } from './kpis'
import type { KPI } from './types'

export interface KPIMatchResult {
  originalText: string
  matchedKPI: KPI | null
  matchScore: number // 0-1, where 1 is exact match
  isExactMatch: boolean
  suggestedKPIs: KPI[] // Top suggestions if no exact match
}

export interface KPIMatchSuggestion {
  kpi: KPI
  score: number
  matchType: 'exact' | 'fuzzy' | 'partial'
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))
  
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        )
      }
    }
  }
  
  return dp[m][n]
}

/**
 * Calculate similarity score (0-1) between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1
  if (s1.length === 0 || s2.length === 0) return 0
  
  // Check for substring match
  if (s1.includes(s2) || s2.includes(s1)) {
    const shorter = Math.min(s1.length, s2.length)
    const longer = Math.max(s1.length, s2.length)
    return shorter / longer * 0.9 // Partial matches get up to 0.9
  }
  
  // Levenshtein-based similarity
  const distance = levenshteinDistance(s1, s2)
  const maxLength = Math.max(s1.length, s2.length)
  return Math.max(0, 1 - distance / maxLength)
}

/**
 * Tokenize a string into words for token-based matching
 */
function tokenize(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2)
}

/**
 * Calculate token overlap score
 */
function calculateTokenOverlap(str1: string, str2: string): number {
  const tokens1 = new Set(tokenize(str1))
  const tokens2 = new Set(tokenize(str2))
  
  if (tokens1.size === 0 || tokens2.size === 0) return 0
  
  let overlap = 0
  for (const token of tokens1) {
    if (tokens2.has(token)) overlap++
  }
  
  const unionSize = new Set([...tokens1, ...tokens2]).size
  return overlap / unionSize // Jaccard similarity
}

/**
 * Match a single KPI string against the KPI library
 */
export function matchKPI(
  inputText: string,
  threshold: number = 0.5
): KPIMatchResult {
  const normalizedInput = inputText.toLowerCase().trim()
  
  // Score all KPIs
  const scores: KPIMatchSuggestion[] = AVAILABLE_KPIS.map(kpi => {
    // Combine name, description, and category for matching
    const kpiName = kpi.name.toLowerCase()
    const kpiDesc = kpi.description.toLowerCase()
    
    // Calculate various similarity metrics
    const nameExact = normalizedInput === kpiName ? 1 : 0
    const nameSimilarity = calculateSimilarity(normalizedInput, kpiName)
    const descSimilarity = calculateSimilarity(normalizedInput, kpiDesc)
    const nameTokenOverlap = calculateTokenOverlap(normalizedInput, kpiName)
    const descTokenOverlap = calculateTokenOverlap(normalizedInput, kpiDesc)
    
    // Weighted score: prioritize name matches, then description
    const score = Math.max(
      nameExact,
      nameSimilarity * 0.9,
      descSimilarity * 0.6,
      nameTokenOverlap * 0.8,
      descTokenOverlap * 0.5
    )
    
    const matchType: 'exact' | 'fuzzy' | 'partial' = 
      nameExact === 1 ? 'exact' :
      nameSimilarity > 0.8 ? 'fuzzy' : 'partial'
    
    return { kpi, score, matchType }
  })
  
  // Sort by score descending
  scores.sort((a, b) => b.score - a.score)
  
  const bestMatch = scores[0]
  const isMatch = bestMatch.score >= threshold
  
  return {
    originalText: inputText,
    matchedKPI: isMatch ? bestMatch.kpi : null,
    matchScore: bestMatch.score,
    isExactMatch: bestMatch.matchType === 'exact',
    suggestedKPIs: scores.slice(0, 5).map(s => s.kpi),
  }
}

/**
 * Match multiple KPI strings and return results with suggestions
 */
export function matchKPIs(
  inputTexts: string[],
  threshold: number = 0.5
): KPIMatchResult[] {
  return inputTexts.map(text => matchKPI(text, threshold))
}

/**
 * Get auto-matched KPI IDs from input texts
 * Returns both matched KPI IDs and unmatched texts
 */
export function autoMatchKPIs(
  inputTexts: string[],
  threshold: number = 0.6
): {
  matchedIds: string[]
  unmatchedTexts: string[]
  results: KPIMatchResult[]
} {
  const results = matchKPIs(inputTexts, threshold)
  
  const matchedIds: string[] = []
  const unmatchedTexts: string[] = []
  
  for (const result of results) {
    if (result.matchedKPI) {
      matchedIds.push(result.matchedKPI.id)
    } else {
      unmatchedTexts.push(result.originalText)
    }
  }
  
  return {
    matchedIds: [...new Set(matchedIds)], // Deduplicate
    unmatchedTexts,
    results,
  }
}

/**
 * Format match result for display
 */
export function formatMatchResult(result: KPIMatchResult): string {
  if (result.isExactMatch) {
    return `✓ Exact match: ${result.matchedKPI?.name}`
  }
  if (result.matchedKPI) {
    return `≈ Fuzzy match (${Math.round(result.matchScore * 100)}%): ${result.matchedKPI.name}`
  }
  return `✗ No match found for "${result.originalText}"`
}
