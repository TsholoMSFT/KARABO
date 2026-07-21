import { exportToPDF } from '@/lib/pdf-export'
import type {
  AIRegulationsInfo,
  BusinessFunction,
  CustomerMetadata,
  CybersecurityInfo,
  ImplementationComplexityInfo,
  StrategicAlignmentInfo,
  UseCase,
  UseCaseAgenticOpportunity,
  UseCaseExpectedValue,
} from '@/lib/types'

export type DiscoveryPdfEffortUnit = 'person-weeks' | 'fte' | 'man-hours'

export interface DiscoveryPdfUseCase {
  id: string
  title: string
  description: string
  impact?: number
  feasibility?: number
  rice?: {
    reach: number
    users?: number
    period?: string
    impact: number
    confidence: number
    effort: number
  }
  kpis?: string[]
  businessFunction?: BusinessFunction
  strategicAlignment?: StrategicAlignmentInfo
  aiRegulations?: AIRegulationsInfo
  cybersecurity?: CybersecurityInfo
  agenticOpportunities?: UseCaseAgenticOpportunity[]
  implementationComplexity?: ImplementationComplexityInfo
  dataSources?: UseCase['dataSources']
  expectedValue?: UseCaseExpectedValue
  aiEffortEstimate?: UseCase['aiEffortEstimate']
  solutionPlays?: string[]
  microsoftSolutions?: UseCase['microsoftSolutions']
  referenceArchitecture?: string
}

export interface DiscoveryPdfReport {
  customerMetadata: CustomerMetadata
  useCases: DiscoveryPdfUseCase[]
}

export async function exportDiscoveryReportToPDF(
  report: DiscoveryPdfReport,
  effortUnit: DiscoveryPdfEffortUnit,
): Promise<void> {
  const createdAt = Date.now()
  const rankedUseCases: UseCase[] = report.useCases.map((useCase) => ({
    ...useCase,
    impact: useCase.impact ?? 0,
    feasibility: useCase.feasibility ?? 0,
    rice: useCase.rice ?? {
      reach: 0,
      impact: 0,
      confidence: 0,
      effort: useCase.aiEffortEstimate?.effortWeeks ?? 0,
    },
    createdAt,
  }))

  await exportToPDF(rankedUseCases, rankedUseCases, 'rice', {
    effortUnit,
    customerMetadata: report.customerMetadata,
    includeCOI: false,
    includeExpectedValue: true,
    includeDataSources: true,
  })
}