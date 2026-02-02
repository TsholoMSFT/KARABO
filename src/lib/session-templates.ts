/**
 * Pre-built session templates by industry
 * Accelerates discovery by providing common use cases and context
 */

import type { Industry, EntityType } from './types'

export interface SessionTemplate {
  id: string
  name: string
  description: string
  industry: Industry
  entityType: EntityType
  suggestedUseCases: TemplateSuggestedUseCase[]
  discoveryPrompts: string[]
  commonChallenges: string[]
  icon: string // Phosphor icon name
}

export interface TemplateSuggestedUseCase {
  title: string
  description: string
  category: string
  typicalCOI: { min: number; max: number } // Annual USD
  typicalEffort: { min: number; max: number } // weeks
  aiProducts: string[]
}

export const SESSION_TEMPLATES: SessionTemplate[] = [
  // Healthcare
  {
    id: 'healthcare-provider',
    name: 'Healthcare Provider',
    description: 'Hospitals, clinics, and health systems focused on patient care and operational efficiency',
    industry: 'healthcare',
    entityType: 'private-company',
    icon: 'FirstAid',
    commonChallenges: [
      'Staff burnout and turnover',
      'Patient wait times and throughput',
      'Clinical documentation burden',
      'Care coordination across departments',
      'Regulatory compliance (HIPAA, HITECH)',
    ],
    discoveryPrompts: [
      'What are your biggest challenges with clinical documentation?',
      'How do you currently handle patient scheduling and capacity?',
      'What manual processes take up the most staff time?',
      'How do you measure and improve patient satisfaction?',
    ],
    suggestedUseCases: [
      {
        title: 'AI-Assisted Clinical Documentation',
        description: 'Use AI to auto-generate clinical notes from physician-patient conversations, reducing documentation time by 50%+',
        category: 'Operational Efficiency',
        typicalCOI: { min: 500000, max: 2000000 },
        typicalEffort: { min: 8, max: 16 },
        aiProducts: ['Azure OpenAI', 'Azure AI Speech', 'Microsoft 365 Copilot'],
      },
      {
        title: 'Intelligent Patient Scheduling',
        description: 'Optimize appointment scheduling using AI to reduce no-shows, balance provider loads, and improve throughput',
        category: 'Customer Experience',
        typicalCOI: { min: 200000, max: 800000 },
        typicalEffort: { min: 6, max: 12 },
        aiProducts: ['Azure OpenAI', 'Power Platform'],
      },
      {
        title: 'Prior Authorization Automation',
        description: 'Automate insurance prior authorization requests using AI to extract requirements and generate submissions',
        category: 'Operational Efficiency',
        typicalCOI: { min: 300000, max: 1200000 },
        typicalEffort: { min: 10, max: 20 },
        aiProducts: ['Azure OpenAI', 'Azure AI Document Intelligence', 'Power Automate'],
      },
      {
        title: 'Clinical Decision Support',
        description: 'AI-powered insights to assist clinicians with diagnosis, treatment options, and drug interactions',
        category: 'Innovation',
        typicalCOI: { min: 100000, max: 500000 },
        typicalEffort: { min: 12, max: 24 },
        aiProducts: ['Azure OpenAI', 'Azure Health Data Services'],
      },
    ],
  },

  // Financial Services
  {
    id: 'financial-services-bank',
    name: 'Banking & Financial Services',
    description: 'Banks, credit unions, and financial institutions focused on customer experience and risk management',
    industry: 'financial-services',
    entityType: 'public-company',
    icon: 'Bank',
    commonChallenges: [
      'Customer service response times',
      'Fraud detection and prevention',
      'Regulatory compliance (KYC, AML)',
      'Legacy system modernization',
      'Personalized customer experiences',
    ],
    discoveryPrompts: [
      'What percentage of customer inquiries could be handled by AI?',
      'How do you currently detect and investigate fraud?',
      'What compliance tasks consume the most analyst time?',
      'How do you personalize offerings for customers today?',
    ],
    suggestedUseCases: [
      {
        title: 'AI Customer Service Agent',
        description: 'Deploy conversational AI to handle routine banking inquiries, account lookups, and transaction disputes',
        category: 'Customer Experience',
        typicalCOI: { min: 1000000, max: 5000000 },
        typicalEffort: { min: 8, max: 16 },
        aiProducts: ['Azure OpenAI', 'Copilot Studio', 'Azure AI Search'],
      },
      {
        title: 'Intelligent Fraud Detection',
        description: 'Use machine learning to identify suspicious transactions in real-time with reduced false positives',
        category: 'Risk & Compliance',
        typicalCOI: { min: 2000000, max: 10000000 },
        typicalEffort: { min: 12, max: 24 },
        aiProducts: ['Azure Machine Learning', 'Azure Synapse', 'Azure OpenAI'],
      },
      {
        title: 'Automated KYC/AML Processing',
        description: 'Automate customer due diligence using AI document extraction and entity verification',
        category: 'Risk & Compliance',
        typicalCOI: { min: 500000, max: 2000000 },
        typicalEffort: { min: 10, max: 20 },
        aiProducts: ['Azure AI Document Intelligence', 'Azure OpenAI', 'Microsoft Purview'],
      },
      {
        title: 'Personalized Product Recommendations',
        description: 'AI-driven next-best-action and product recommendations based on customer behavior and life events',
        category: 'Revenue Growth',
        typicalCOI: { min: 300000, max: 1500000 },
        typicalEffort: { min: 8, max: 14 },
        aiProducts: ['Azure OpenAI', 'Azure Machine Learning', 'Dynamics 365'],
      },
    ],
  },

  // Manufacturing
  {
    id: 'manufacturing',
    name: 'Manufacturing & Industrial',
    description: 'Discrete and process manufacturers focused on production efficiency and quality',
    industry: 'manufacturing',
    entityType: 'public-company',
    icon: 'Factory',
    commonChallenges: [
      'Unplanned equipment downtime',
      'Quality defects and rework',
      'Supply chain visibility',
      'Worker safety and training',
      'Energy and sustainability goals',
    ],
    discoveryPrompts: [
      'What causes the most unplanned downtime in your operations?',
      'How do you currently identify quality issues?',
      'What visibility do you have into supply chain disruptions?',
      'How do you onboard and train production workers?',
    ],
    suggestedUseCases: [
      {
        title: 'Predictive Maintenance',
        description: 'Use IoT sensors and AI to predict equipment failures before they occur, reducing downtime by 30-50%',
        category: 'Operational Efficiency',
        typicalCOI: { min: 500000, max: 3000000 },
        typicalEffort: { min: 12, max: 24 },
        aiProducts: ['Azure IoT Hub', 'Azure Machine Learning', 'Azure Digital Twins'],
      },
      {
        title: 'AI-Powered Quality Inspection',
        description: 'Computer vision to detect defects on production lines in real-time with higher accuracy than manual inspection',
        category: 'Operational Efficiency',
        typicalCOI: { min: 300000, max: 1500000 },
        typicalEffort: { min: 8, max: 16 },
        aiProducts: ['Azure AI Vision', 'Azure IoT Edge', 'Azure Machine Learning'],
      },
      {
        title: 'Intelligent Supply Chain',
        description: 'AI-driven demand forecasting and supply chain optimization to reduce inventory costs and stockouts',
        category: 'Operational Efficiency',
        typicalCOI: { min: 400000, max: 2000000 },
        typicalEffort: { min: 10, max: 20 },
        aiProducts: ['Azure OpenAI', 'Azure Synapse', 'Dynamics 365 Supply Chain'],
      },
      {
        title: 'AI Training Assistant',
        description: 'Generative AI assistant to help workers access procedures, troubleshoot issues, and complete training',
        category: 'Employee Enablement',
        typicalCOI: { min: 150000, max: 600000 },
        typicalEffort: { min: 6, max: 12 },
        aiProducts: ['Azure OpenAI', 'Azure AI Search', 'Microsoft 365 Copilot'],
      },
    ],
  },

  // Retail
  {
    id: 'retail',
    name: 'Retail & Consumer Goods',
    description: 'Retailers and consumer goods companies focused on customer experience and omnichannel',
    industry: 'retail',
    entityType: 'public-company',
    icon: 'Storefront',
    commonChallenges: [
      'Inventory optimization across channels',
      'Personalized shopping experience',
      'Customer service at scale',
      'Associate productivity and retention',
      'Demand forecasting accuracy',
    ],
    discoveryPrompts: [
      'How do you personalize the shopping experience today?',
      'What percentage of customer service could be automated?',
      'How accurate is your demand forecasting?',
      'What tools do store associates use to assist customers?',
    ],
    suggestedUseCases: [
      {
        title: 'AI Shopping Assistant',
        description: 'Conversational AI to help customers find products, check availability, and get personalized recommendations',
        category: 'Customer Experience',
        typicalCOI: { min: 500000, max: 2500000 },
        typicalEffort: { min: 8, max: 16 },
        aiProducts: ['Azure OpenAI', 'Copilot Studio', 'Azure AI Search'],
      },
      {
        title: 'Intelligent Inventory Optimization',
        description: 'AI-driven inventory allocation and replenishment to reduce stockouts and overstock',
        category: 'Operational Efficiency',
        typicalCOI: { min: 1000000, max: 5000000 },
        typicalEffort: { min: 12, max: 20 },
        aiProducts: ['Azure Machine Learning', 'Azure Synapse', 'Dynamics 365'],
      },
      {
        title: 'Visual Search & Product Discovery',
        description: 'Allow customers to search by image to find similar products in your catalog',
        category: 'Customer Experience',
        typicalCOI: { min: 200000, max: 800000 },
        typicalEffort: { min: 6, max: 12 },
        aiProducts: ['Azure AI Vision', 'Azure AI Search', 'Azure OpenAI'],
      },
      {
        title: 'Store Associate Copilot',
        description: 'AI assistant for store associates to answer product questions, check inventory, and complete tasks',
        category: 'Employee Enablement',
        typicalCOI: { min: 300000, max: 1200000 },
        typicalEffort: { min: 6, max: 12 },
        aiProducts: ['Microsoft 365 Copilot', 'Azure OpenAI', 'Power Platform'],
      },
    ],
  },

  // Government
  {
    id: 'government-federal',
    name: 'Government & Public Sector',
    description: 'Federal, state, and local government agencies focused on citizen services and operational efficiency',
    industry: 'government',
    entityType: 'government',
    icon: 'Buildings',
    commonChallenges: [
      'Citizen service wait times',
      'Legacy system modernization',
      'Document processing backlogs',
      'Workforce training and retention',
      'Data security and compliance',
    ],
    discoveryPrompts: [
      'What citizen services have the longest wait times?',
      'How do you currently process forms and applications?',
      'What manual processes could benefit from automation?',
      'How do you ensure accessibility for all citizens?',
    ],
    suggestedUseCases: [
      {
        title: 'AI Citizen Service Agent',
        description: 'Conversational AI to answer citizen questions, check application status, and guide through processes',
        category: 'Citizen Experience',
        typicalCOI: { min: 500000, max: 2000000 },
        typicalEffort: { min: 10, max: 18 },
        aiProducts: ['Azure OpenAI', 'Copilot Studio', 'Azure AI Search'],
      },
      {
        title: 'Intelligent Document Processing',
        description: 'Automate form intake, data extraction, and validation to reduce processing backlogs',
        category: 'Operational Efficiency',
        typicalCOI: { min: 300000, max: 1500000 },
        typicalEffort: { min: 8, max: 16 },
        aiProducts: ['Azure AI Document Intelligence', 'Azure OpenAI', 'Power Automate'],
      },
      {
        title: 'Policy & Procedure Assistant',
        description: 'AI assistant to help employees find and interpret policies, regulations, and procedures',
        category: 'Employee Enablement',
        typicalCOI: { min: 200000, max: 800000 },
        typicalEffort: { min: 6, max: 12 },
        aiProducts: ['Azure OpenAI', 'Azure AI Search', 'Microsoft 365 Copilot'],
      },
      {
        title: 'Grant & Application Review',
        description: 'AI-assisted review of grant applications and submissions to accelerate processing',
        category: 'Operational Efficiency',
        typicalCOI: { min: 150000, max: 600000 },
        typicalEffort: { min: 8, max: 14 },
        aiProducts: ['Azure OpenAI', 'Azure AI Document Intelligence'],
      },
    ],
  },

  // Technology
  {
    id: 'technology',
    name: 'Technology & Software',
    description: 'Software companies and tech firms focused on product development and customer success',
    industry: 'technology',
    entityType: 'public-company',
    icon: 'Code',
    commonChallenges: [
      'Customer support ticket volume',
      'Developer productivity',
      'Documentation maintenance',
      'Code quality and security',
      'Customer onboarding and adoption',
    ],
    discoveryPrompts: [
      'What percentage of support tickets are repetitive?',
      'How do developers find and reuse existing code?',
      'How current is your product documentation?',
      'What slows down your development velocity?',
    ],
    suggestedUseCases: [
      {
        title: 'AI Customer Support Agent',
        description: 'Automate tier-1 support with AI that understands your product and can troubleshoot issues',
        category: 'Customer Experience',
        typicalCOI: { min: 400000, max: 2000000 },
        typicalEffort: { min: 8, max: 14 },
        aiProducts: ['Azure OpenAI', 'Copilot Studio', 'Azure AI Search'],
      },
      {
        title: 'GitHub Copilot Adoption',
        description: 'Accelerate developer productivity with AI pair programming and code generation',
        category: 'Employee Enablement',
        typicalCOI: { min: 500000, max: 3000000 },
        typicalEffort: { min: 4, max: 8 },
        aiProducts: ['GitHub Copilot', 'GitHub Copilot Enterprise'],
      },
      {
        title: 'Intelligent Documentation',
        description: 'Auto-generate and maintain documentation from code, APIs, and product specs',
        category: 'Operational Efficiency',
        typicalCOI: { min: 150000, max: 600000 },
        typicalEffort: { min: 6, max: 12 },
        aiProducts: ['Azure OpenAI', 'GitHub Copilot'],
      },
      {
        title: 'AI Code Review & Security',
        description: 'Automated code review for quality, security vulnerabilities, and best practices',
        category: 'Risk & Compliance',
        typicalCOI: { min: 200000, max: 1000000 },
        typicalEffort: { min: 6, max: 12 },
        aiProducts: ['GitHub Advanced Security', 'Azure OpenAI'],
      },
    ],
  },
]

/**
 * Get templates filtered by industry
 */
export function getTemplatesByIndustry(industry?: Industry): SessionTemplate[] {
  if (!industry) return SESSION_TEMPLATES
  return SESSION_TEMPLATES.filter(t => t.industry === industry)
}

/**
 * Get a specific template by ID
 */
export function getTemplateById(id: string): SessionTemplate | undefined {
  return SESSION_TEMPLATES.find(t => t.id === id)
}

/**
 * Get all unique industries that have templates
 */
export function getTemplateIndustries(): Industry[] {
  return [...new Set(SESSION_TEMPLATES.map(t => t.industry))]
}
