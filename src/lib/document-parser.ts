/**
 * Document Parser Utilities
 * 
 * Parses Word (.docx), Excel (.xlsx/.xls), and PDF files to extract use case data.
 * Supports:
 * - Table-based extraction for structured documents
 * - AI-assisted free-text parsing for unstructured documents
 */

import readXlsxFile from 'read-excel-file'
import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// ============================================================================
// TYPES
// ============================================================================

export interface ParsedUseCase {
  name: string
  problemStatement: string
  expectedBenefits: string
  kpis: string[]
  // Parsing metadata
  parseConfidence: 'high' | 'medium' | 'low'
  parseMethod: 'table' | 'ai-freetext' | 'structured'
  rawText?: string
}

export interface DocumentParseResult {
  success: boolean
  useCases: ParsedUseCase[]
  warnings: string[]
  error?: string
  documentType: 'excel' | 'word' | 'pdf'
  parseMethod: 'table' | 'ai-freetext' | 'hybrid'
}

// Column name variations we recognize
const COLUMN_VARIANTS = {
  name: ['name', 'title', 'use case', 'use case name', 'usecase', 'use-case'],
  problemStatement: ['problem', 'problem statement', 'description', 'challenge', 'issue', 'pain point', 'current state'],
  expectedBenefits: ['benefits', 'expected benefits', 'value', 'expected value', 'outcomes', 'expected outcomes', 'business value'],
  kpis: ['kpi', 'kpis', 'key data points', 'metrics', 'key performance indicators', 'reporting', 'measurements'],
}

// ============================================================================
// EXCEL PARSER
// ============================================================================

export async function parseExcel(file: File): Promise<DocumentParseResult> {
  try {
    // Basic guardrails for user-supplied spreadsheets.
    const MAX_EXCEL_BYTES = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_EXCEL_BYTES) {
      return {
        success: false,
        useCases: [],
        warnings: [],
        error: 'Excel file is too large (max 10MB). Please upload a smaller file.',
        documentType: 'excel',
        parseMethod: 'table',
      }
    }

    // Read as arrays of values: string | number | boolean | Date | null.
    // Avoids using untrusted header strings as object keys.
    const rows = (await readXlsxFile(file)) as unknown[][]

    if (rows.length < 2) {
      return {
        success: false,
        useCases: [],
        warnings: [],
        error: 'No data found in Excel file',
        documentType: 'excel',
        parseMethod: 'table',
      }
    }

    const warnings: string[] = []

    const MAX_ROWS = 5000
    const MAX_COLS = 200
    if (rows.length > MAX_ROWS) {
      return {
        success: false,
        useCases: [],
        warnings: [],
        error: `Excel file has too many rows (${rows.length}). Please reduce to <= ${MAX_ROWS}.`,
        documentType: 'excel',
        parseMethod: 'table',
      }
    }

    // Header row
    const headerRow = rows[0] ?? []
    const headers = (Array.isArray(headerRow) ? headerRow : [])
      .slice(0, MAX_COLS)
      .map((h) => String(h ?? '').trim())
      .map((h) => (h.length > 200 ? h.slice(0, 200) : h))

    const dangerous = new Set(['__proto__', 'prototype', 'constructor'])
    const hasDangerousHeaders = headers.some((h) => dangerous.has(h.toLowerCase()))
    if (hasDangerousHeaders) {
      warnings.push('Some spreadsheet headers were ignored for safety.')
    }
    
    // Detect column mappings
    const columnMapping = detectColumnMapping(headers)
    
    if (!columnMapping.name) {
      return {
        success: false,
        useCases: [],
        warnings: ['Could not find a column for Use Case Name. Expected columns like: Name, Title, Use Case'],
        error: 'Missing required column: Use Case Name',
        documentType: 'excel',
        parseMethod: 'table',
      }
    }
    
    if (!columnMapping.problemStatement) warnings.push('No Problem Statement column found')
    if (!columnMapping.expectedBenefits) warnings.push('No Expected Benefits column found')
    if (!columnMapping.kpis) warnings.push('No KPIs column found')

    const nameIndex = columnMapping.name ? headers.indexOf(columnMapping.name) : -1
    const problemIndex = columnMapping.problemStatement ? headers.indexOf(columnMapping.problemStatement) : -1
    const benefitsIndex = columnMapping.expectedBenefits ? headers.indexOf(columnMapping.expectedBenefits) : -1
    const kpisIndex = columnMapping.kpis ? headers.indexOf(columnMapping.kpis) : -1

    if (nameIndex < 0) {
      return {
        success: false,
        useCases: [],
        warnings,
        error: 'Missing required column: Use Case Name',
        documentType: 'excel',
        parseMethod: 'table',
      }
    }
    
    const getCell = (row: unknown[], idx: number): string => {
      if (idx < 0) return ''
      const val = row[idx]
      return String(val ?? '').trim()
    }

    // Parse rows (skip header)
    const useCases: ParsedUseCase[] = rows
      .slice(1)
      .filter((row) => Array.isArray(row) && getCell(row, nameIndex))
      .map((row) => {
        const safeRow = row.slice(0, MAX_COLS)
        const name = getCell(safeRow, nameIndex)
        const problemStatement = getCell(safeRow, problemIndex)
        const expectedBenefits = getCell(safeRow, benefitsIndex)
        const kpisRaw = getCell(safeRow, kpisIndex)
        return {
          name,
          problemStatement,
          expectedBenefits,
          kpis: kpisIndex >= 0 ? parseKPIString(kpisRaw) : [],
          parseConfidence: 'high' as const,
          parseMethod: 'table' as const,
        }
      })
    
    return {
      success: true,
      useCases,
      warnings,
      documentType: 'excel',
      parseMethod: 'table',
    }
  } catch (error) {
    return {
      success: false,
      useCases: [],
      warnings: [],
      error: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      documentType: 'excel',
      parseMethod: 'table',
    }
  }
}

// ============================================================================
// WORD PARSER
// ============================================================================

export async function parseWord(file: File): Promise<DocumentParseResult> {
  try {
    const buffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    const text = result.value
    
    // First try to detect table-like structure
    const tableResult = parseTextAsTable(text)
    if (tableResult.useCases.length > 0) {
      return {
        ...tableResult,
        documentType: 'word',
      }
    }
    
    // Fall back to AI-assisted free-text parsing
    const aiResult = await parseWithAI(text)
    return {
      ...aiResult,
      documentType: 'word',
      parseMethod: 'ai-freetext',
    }
  } catch (error) {
    return {
      success: false,
      useCases: [],
      warnings: [],
      error: `Failed to parse Word file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      documentType: 'word',
      parseMethod: 'table',
    }
  }
}

// ============================================================================
// PDF PARSER
// ============================================================================

export async function parsePDF(file: File): Promise<DocumentParseResult> {
  try {
    const buffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
    
    let fullText = ''
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageText = (textContent.items as any[])
        .filter(item => item && typeof item.str === 'string')
        .map(item => item.str as string)
        .join(' ')
      fullText += pageText + '\n\n'
    }
    
    if (!fullText.trim()) {
      return {
        success: false,
        useCases: [],
        warnings: ['PDF appears to be empty or contains only images'],
        error: 'No text content found in PDF',
        documentType: 'pdf',
        parseMethod: 'table',
      }
    }
    
    // First try table-based parsing
    const tableResult = parseTextAsTable(fullText)
    if (tableResult.useCases.length > 0) {
      return {
        ...tableResult,
        documentType: 'pdf',
      }
    }
    
    // Fall back to AI-assisted free-text parsing
    const aiResult = await parseWithAI(fullText)
    return {
      ...aiResult,
      documentType: 'pdf',
      parseMethod: 'ai-freetext',
    }
  } catch (error) {
    return {
      success: false,
      useCases: [],
      warnings: [],
      error: `Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      documentType: 'pdf',
      parseMethod: 'table',
    }
  }
}

// ============================================================================
// SHARED UTILITIES
// ============================================================================

function detectColumnMapping(headers: string[]): Record<string, string | null> {
  const mapping: Record<string, string | null> = {
    name: null,
    problemStatement: null,
    expectedBenefits: null,
    kpis: null,
  }
  
  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim()
    
    for (const [field, variants] of Object.entries(COLUMN_VARIANTS)) {
      if (variants.some(v => normalizedHeader.includes(v) || v.includes(normalizedHeader))) {
        if (!mapping[field]) {
          mapping[field] = header
        }
      }
    }
  }
  
  return mapping
}

function parseKPIString(kpiString: string): string[] {
  if (!kpiString) return []
  
  // Split by common delimiters
  return kpiString
    .split(/[,;•\n|]/)
    .map(kpi => kpi.trim())
    .filter(kpi => kpi.length > 0)
}

function parseTextAsTable(text: string): Omit<DocumentParseResult, 'documentType'> {
  const useCases: ParsedUseCase[] = []
  const warnings: string[] = []
  
  // Look for numbered or bulleted use cases
  const useCasePatterns = [
    // "1. Use Case Name: ..." or "1) Use Case Name: ..."
    /(?:^|\n)(?:\d+[.)\s]+)(.+?)(?:\n|$)/gi,
    // "Use Case: Name" pattern
    /(?:use\s*case\s*[:]\s*)([^\n]+)/gi,
    // "• Title" bullet points
    /(?:^|\n)[•\-\*]\s*(.+?)(?:\n|$)/gi,
  ]
  
  // Try to find structured sections
  const sections = text.split(/(?:use\s*case\s*\d*\s*[:.\-]?|#{1,3}\s*|\*{2,})/i)
  
  for (const section of sections) {
    if (!section.trim()) continue
    
    const lines = section.split('\n').map(l => l.trim()).filter(l => l)
    if (lines.length === 0) continue
    
    // First non-empty line might be the title
    const potentialTitle = lines[0]
    if (potentialTitle.length < 5 || potentialTitle.length > 200) continue
    
    // Look for problem/benefit/KPI sections
    let problemStatement = ''
    let expectedBenefits = ''
    let kpis: string[] = []
    
    const fullSection = lines.join('\n')
    
    // Extract problem statement
    const problemMatch = fullSection.match(/(?:problem|challenge|issue|current\s*state)\s*[:.]?\s*([^\n]+(?:\n(?![A-Z][a-z]*:)[^\n]+)*)/i)
    if (problemMatch) {
      problemStatement = problemMatch[1].trim()
    }
    
    // Extract expected benefits
    const benefitsMatch = fullSection.match(/(?:benefit|value|outcome|expected)\s*[:.]?\s*([^\n]+(?:\n(?![A-Z][a-z]*:)[^\n]+)*)/i)
    if (benefitsMatch) {
      expectedBenefits = benefitsMatch[1].trim()
    }
    
    // Extract KPIs
    const kpiMatch = fullSection.match(/(?:kpi|metric|measurement|reporting)\s*[:.]?\s*([^\n]+(?:\n(?![A-Z][a-z]*:)[^\n]+)*)/i)
    if (kpiMatch) {
      kpis = parseKPIString(kpiMatch[1])
    }
    
    // Only add if we found something meaningful
    if (potentialTitle && (problemStatement || expectedBenefits || kpis.length > 0)) {
      useCases.push({
        name: potentialTitle.replace(/^[\d.)\-•\*\s]+/, '').trim(),
        problemStatement,
        expectedBenefits,
        kpis,
        parseConfidence: 'medium',
        parseMethod: 'structured',
        rawText: section,
      })
    }
  }
  
  if (useCases.length === 0) {
    warnings.push('Could not detect structured use case format. Will attempt AI-assisted parsing.')
  }
  
  return {
    success: useCases.length > 0,
    useCases,
    warnings,
    parseMethod: 'table',
  }
}

// ============================================================================
// AI-ASSISTED FREE-TEXT PARSING
// ============================================================================

async function parseWithAI(text: string): Promise<Omit<DocumentParseResult, 'documentType'>> {
  // Check if AI service is available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const llm = (window as any).llm
  
  if (!llm) {
    return {
      success: false,
      useCases: [],
      warnings: ['AI service not available. Please ensure the application is properly configured.'],
      error: 'AI-assisted parsing unavailable',
      parseMethod: 'ai-freetext',
    }
  }
  
  try {
    const prompt = `You are a document parser. Extract use cases from the following text.

For each use case found, extract:
1. Name/Title
2. Problem Statement (what problem does it solve?)
3. Expected Benefits (business value, outcomes)
4. KPIs/Key Data Points for Reporting (metrics to measure success)

Return your response as a valid JSON array with this structure:
[
  {
    "name": "Use Case Name",
    "problemStatement": "Description of the problem",
    "expectedBenefits": "Expected business benefits",
    "kpis": ["KPI 1", "KPI 2"]
  }
]

If you cannot find any use cases, return an empty array: []

IMPORTANT: Only return the JSON array, no other text.

Document text:
${text.substring(0, 15000)}`

    const response = await llm(prompt, {
      maxTokens: 4000,
      temperature: 0.2,
    })
    
    // Extract JSON from response
    let jsonStr = response.trim()
    
    // Handle markdown code blocks
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\s*\n?/g, '').replace(/```\s*$/g, '')
    }
    
    const parsed = JSON.parse(jsonStr)
    
    if (!Array.isArray(parsed)) {
      throw new Error('AI response was not an array')
    }
    
    const useCases: ParsedUseCase[] = parsed.map((item: Record<string, unknown>) => ({
      name: String(item.name || ''),
      problemStatement: String(item.problemStatement || ''),
      expectedBenefits: String(item.expectedBenefits || ''),
      kpis: Array.isArray(item.kpis) ? item.kpis.map(String) : [],
      parseConfidence: 'medium' as const,
      parseMethod: 'ai-freetext' as const,
      rawText: text.substring(0, 500) + '...',
    }))
    
    return {
      success: useCases.length > 0,
      useCases,
      warnings: useCases.length === 0 
        ? ['AI could not identify any use cases in the document']
        : ['Use cases extracted via AI. Please review for accuracy.'],
      parseMethod: 'ai-freetext',
    }
  } catch (error) {
    return {
      success: false,
      useCases: [],
      warnings: [],
      error: `AI parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      parseMethod: 'ai-freetext',
    }
  }
}

// ============================================================================
// MAIN PARSE FUNCTION
// ============================================================================

export async function parseDocument(file: File): Promise<DocumentParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'xlsx':
    case 'xls':
      return parseExcel(file)
    case 'docx':
      return parseWord(file)
    case 'pdf':
      return parsePDF(file)
    default:
      return {
        success: false,
        useCases: [],
        warnings: [],
        error: `Unsupported file type: ${extension}. Supported formats: .xlsx, .xls, .docx, .pdf`,
        documentType: 'excel',
        parseMethod: 'table',
      }
  }
}
