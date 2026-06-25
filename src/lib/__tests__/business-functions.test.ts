import { describe, it, expect } from 'vitest'
import type { BusinessFunction } from '../types'
import {
  BUSINESS_FUNCTIONS,
  BUSINESS_FUNCTION_IDS,
  businessFunctionLabels,
  businessFunctionLabel,
  getBusinessFunctionMeta,
  groupedBusinessFunctions,
  buildBusinessFunctionContext,
} from '../business-functions'

// Compile-time completeness: if a BusinessFunction is added to the union without
// metadata (or vice-versa), this object literal fails to type-check.
const ALL_FUNCTIONS: Record<BusinessFunction, true> = {
  'cross-functional': true,
  finance: true,
  'accounting-controllership': true,
  'fp-and-a': true,
  treasury: true,
  tax: true,
  'accounts-payable': true,
  'accounts-receivable': true,
  'investor-relations': true,
  'human-resources': true,
  'talent-acquisition': true,
  'learning-development': true,
  'compensation-payroll': true,
  'hr-operations': true,
  'risk-management': true,
  'internal-audit': true,
  legal: true,
  compliance: true,
  'corporate-governance': true,
  'data-privacy': true,
  'fraud-financial-crime': true,
  sales: true,
  'sales-operations': true,
  marketing: true,
  'customer-success': true,
  'customer-service': true,
  'product-management': true,
  operations: true,
  'supply-chain': true,
  procurement: true,
  manufacturing: true,
  quality: true,
  'field-service': true,
  it: true,
  'software-engineering': true,
  'data-analytics': true,
  'information-security': true,
  'enterprise-architecture': true,
  'it-service-management': true,
  'executive-leadership': true,
  'corporate-strategy': true,
  'transformation-pmo': true,
  'corporate-communications': true,
  'facilities-realestate': true,
  'ehs-sustainability': true,
  'research-development': true,
}

describe('business-functions taxonomy', () => {
  it('has metadata for every function in the union, with unique ids', () => {
    const unionIds = Object.keys(ALL_FUNCTIONS) as BusinessFunction[]
    expect(BUSINESS_FUNCTIONS).toHaveLength(unionIds.length)
    const ids = BUSINESS_FUNCTIONS.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length) // unique
    for (const id of unionIds) {
      expect(getBusinessFunctionMeta(id), `missing meta for ${id}`).toBeTruthy()
    }
  })

  it('every function has a label, personas, pain points and KPIs', () => {
    for (const f of BUSINESS_FUNCTIONS) {
      expect(f.label.length).toBeGreaterThan(0)
      expect(businessFunctionLabels[f.id]).toBe(f.label)
      expect(f.personas.length).toBeGreaterThan(0)
      expect(f.painPoints.length).toBeGreaterThan(0)
      expect(f.kpis.length).toBeGreaterThan(0)
    }
  })

  it('businessFunctionLabel resolves a known id', () => {
    expect(businessFunctionLabel('finance')).toBe('Finance & Accounting')
    expect(businessFunctionLabel('internal-audit')).toBe('Internal Audit & Assurance')
  })

  it('groups functions with enterprise-wide first and full coverage', () => {
    const groups = groupedBusinessFunctions()
    expect(groups[0].group).toBe('enterprise-wide')
    expect(groups[0].functions.map((f) => f.id)).toContain('cross-functional')
    const grouped = groups.flatMap((g) => g.functions)
    expect(grouped).toHaveLength(BUSINESS_FUNCTIONS.length) // every function placed in a group
  })

  it('BUSINESS_FUNCTION_IDS lists every function', () => {
    expect(BUSINESS_FUNCTION_IDS).toHaveLength(BUSINESS_FUNCTIONS.length)
  })
})

describe('buildBusinessFunctionContext', () => {
  it('returns an enterprise-wide instruction when nothing (or only cross-functional) is selected', () => {
    const empty = buildBusinessFunctionContext([])
    expect(empty).toMatch(/enterprise-wide/i)
    expect(empty).toMatch(/Valid businessFunction values/i)
    expect(buildBusinessFunctionContext(['cross-functional'])).toMatch(/enterprise-wide/i)
  })

  it('includes labels, KPIs and a tagging instruction for selected functions', () => {
    const ctx = buildBusinessFunctionContext(['finance', 'risk-management'])
    expect(ctx).toMatch(/Finance & Accounting/)
    expect(ctx).toMatch(/Enterprise Risk Management/)
    expect(ctx).toMatch(/Month-end close days/)
    expect(ctx).toMatch(/Tag EACH use case/i)
  })

  it('includes the business unit label when provided', () => {
    const ctx = buildBusinessFunctionContext(['finance'], 'Personal & Business Banking')
    expect(ctx).toMatch(/Personal & Business Banking/)
  })
})
