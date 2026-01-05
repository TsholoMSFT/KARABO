/**
 * Microsoft Solution Catalog
 * Defines Microsoft products, services, and reference architectures
 * for Solution Envisioning in the Innovation Hub Methodology
 */

// ============================================================================
// MICROSOFT PRODUCT FAMILIES
// ============================================================================

export type MicrosoftProductFamily = 
  | 'azure-ai'
  | 'azure-data'
  | 'azure-infrastructure'
  | 'power-platform'
  | 'microsoft-365'
  | 'dynamics-365'
  | 'microsoft-fabric'
  | 'microsoft-security'

export const PRODUCT_FAMILY_LABELS: Record<MicrosoftProductFamily, string> = {
  'azure-ai': 'Azure AI',
  'azure-data': 'Azure Data',
  'azure-infrastructure': 'Azure Infrastructure',
  'power-platform': 'Power Platform',
  'microsoft-365': 'Microsoft 365',
  'dynamics-365': 'Dynamics 365',
  'microsoft-fabric': 'Microsoft Fabric',
  'microsoft-security': 'Microsoft Security',
}

export const PRODUCT_FAMILY_COLORS: Record<MicrosoftProductFamily, string> = {
  'azure-ai': 'bg-purple-100 text-purple-800 border-purple-200',
  'azure-data': 'bg-blue-100 text-blue-800 border-blue-200',
  'azure-infrastructure': 'bg-sky-100 text-sky-800 border-sky-200',
  'power-platform': 'bg-amber-100 text-amber-800 border-amber-200',
  'microsoft-365': 'bg-red-100 text-red-800 border-red-200',
  'dynamics-365': 'bg-green-100 text-green-800 border-green-200',
  'microsoft-fabric': 'bg-orange-100 text-orange-800 border-orange-200',
  'microsoft-security': 'bg-slate-100 text-slate-800 border-slate-200',
}

export const PRODUCT_FAMILY_ICONS: Record<MicrosoftProductFamily, string> = {
  'azure-ai': '🧠',
  'azure-data': '📊',
  'azure-infrastructure': '☁️',
  'power-platform': '⚡',
  'microsoft-365': '📧',
  'dynamics-365': '🔄',
  'microsoft-fabric': '🧵',
  'microsoft-security': '🔒',
}

// ============================================================================
// IMPLEMENTATION COMPLEXITY
// ============================================================================

export type ImplementationComplexity = 'low' | 'medium' | 'high' | 'very-high'

export interface ComplexityIndicator {
  level: ImplementationComplexity
  label: string
  description: string
  color: string
  typicalDuration: string
  typicalTeamSize: string
}

export const COMPLEXITY_INDICATORS: Record<ImplementationComplexity, ComplexityIndicator> = {
  'low': {
    level: 'low',
    label: 'Low Complexity',
    description: '1-2 services, minimal integration, standard configuration',
    color: 'bg-green-100 text-green-800 border-green-200',
    typicalDuration: '2-4 weeks',
    typicalTeamSize: '1-2 people',
  },
  'medium': {
    level: 'medium',
    label: 'Medium Complexity',
    description: '2-4 services, some integration, custom development',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    typicalDuration: '1-3 months',
    typicalTeamSize: '3-5 people',
  },
  'high': {
    level: 'high',
    label: 'High Complexity',
    description: '4-6 services, significant integration, enterprise-grade',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    typicalDuration: '3-6 months',
    typicalTeamSize: '5-10 people',
  },
  'very-high': {
    level: 'very-high',
    label: 'Very High Complexity',
    description: '6+ services, complex integrations, transformation program',
    color: 'bg-red-100 text-red-800 border-red-200',
    typicalDuration: '6-12+ months',
    typicalTeamSize: '10+ people',
  },
}

// ============================================================================
// AZURE AI SERVICES
// ============================================================================

export type AzureAIService = 
  | 'azure-openai'
  | 'azure-ai-search'
  | 'azure-ai-vision'
  | 'azure-ai-speech'
  | 'azure-ai-language'
  | 'azure-ai-document-intelligence'
  | 'azure-machine-learning'
  | 'azure-ai-studio'
  | 'azure-ai-content-safety'
  | 'azure-bot-service'

export const AZURE_AI_SERVICES: Record<AzureAIService, { label: string; description: string; complexity: ImplementationComplexity }> = {
  'azure-openai': { 
    label: 'Azure OpenAI Service', 
    description: 'GPT-4, GPT-4o, embeddings, and DALL-E models for generative AI',
    complexity: 'medium',
  },
  'azure-ai-search': { 
    label: 'Azure AI Search', 
    description: 'Enterprise search with vector/semantic capabilities for RAG patterns',
    complexity: 'medium',
  },
  'azure-ai-vision': { 
    label: 'Azure AI Vision', 
    description: 'Image and video analysis, OCR, spatial analysis',
    complexity: 'low',
  },
  'azure-ai-speech': { 
    label: 'Azure AI Speech', 
    description: 'Speech-to-text, text-to-speech, translation, speaker recognition',
    complexity: 'low',
  },
  'azure-ai-language': { 
    label: 'Azure AI Language', 
    description: 'NLP capabilities: sentiment, entities, summarization, Q&A',
    complexity: 'low',
  },
  'azure-ai-document-intelligence': { 
    label: 'Azure AI Document Intelligence', 
    description: 'Extract text, structure, and fields from documents',
    complexity: 'medium',
  },
  'azure-machine-learning': { 
    label: 'Azure Machine Learning', 
    description: 'End-to-end ML platform for training and deploying models',
    complexity: 'high',
  },
  'azure-ai-studio': { 
    label: 'Azure AI Studio', 
    description: 'Unified platform for building generative AI applications',
    complexity: 'medium',
  },
  'azure-ai-content-safety': { 
    label: 'Azure AI Content Safety', 
    description: 'Detect harmful content in text and images',
    complexity: 'low',
  },
  'azure-bot-service': { 
    label: 'Azure Bot Service', 
    description: 'Build and deploy conversational AI bots',
    complexity: 'medium',
  },
}

// ============================================================================
// AZURE DATA SERVICES
// ============================================================================

export type AzureDataService = 
  | 'azure-sql'
  | 'azure-cosmos-db'
  | 'azure-synapse'
  | 'azure-data-factory'
  | 'azure-databricks'
  | 'azure-event-hubs'
  | 'azure-stream-analytics'
  | 'azure-data-lake'
  | 'azure-purview'

export const AZURE_DATA_SERVICES: Record<AzureDataService, { label: string; description: string; complexity: ImplementationComplexity }> = {
  'azure-sql': { 
    label: 'Azure SQL', 
    description: 'Managed SQL database with built-in AI capabilities',
    complexity: 'low',
  },
  'azure-cosmos-db': { 
    label: 'Azure Cosmos DB', 
    description: 'Globally distributed, multi-model database with vector search',
    complexity: 'medium',
  },
  'azure-synapse': { 
    label: 'Azure Synapse Analytics', 
    description: 'Unified analytics platform for data warehousing and big data',
    complexity: 'high',
  },
  'azure-data-factory': { 
    label: 'Azure Data Factory', 
    description: 'Cloud-scale data integration and ETL/ELT pipelines',
    complexity: 'medium',
  },
  'azure-databricks': { 
    label: 'Azure Databricks', 
    description: 'Apache Spark-based analytics platform',
    complexity: 'high',
  },
  'azure-event-hubs': { 
    label: 'Azure Event Hubs', 
    description: 'Real-time data streaming platform',
    complexity: 'medium',
  },
  'azure-stream-analytics': { 
    label: 'Azure Stream Analytics', 
    description: 'Real-time analytics on streaming data',
    complexity: 'medium',
  },
  'azure-data-lake': { 
    label: 'Azure Data Lake Storage', 
    description: 'Scalable data lake for big data analytics',
    complexity: 'low',
  },
  'azure-purview': { 
    label: 'Microsoft Purview', 
    description: 'Unified data governance and cataloging',
    complexity: 'medium',
  },
}

// ============================================================================
// POWER PLATFORM SERVICES
// ============================================================================

export type PowerPlatformService = 
  | 'power-apps'
  | 'power-automate'
  | 'power-bi'
  | 'power-pages'
  | 'copilot-studio'
  | 'dataverse'

export const POWER_PLATFORM_SERVICES: Record<PowerPlatformService, { label: string; description: string; complexity: ImplementationComplexity }> = {
  'power-apps': { 
    label: 'Power Apps', 
    description: 'Low-code app development for web and mobile',
    complexity: 'low',
  },
  'power-automate': { 
    label: 'Power Automate', 
    description: 'Workflow automation and RPA capabilities',
    complexity: 'low',
  },
  'power-bi': { 
    label: 'Power BI', 
    description: 'Business intelligence and data visualization',
    complexity: 'low',
  },
  'power-pages': { 
    label: 'Power Pages', 
    description: 'Low-code external-facing websites and portals',
    complexity: 'medium',
  },
  'copilot-studio': { 
    label: 'Microsoft Copilot Studio', 
    description: 'Build custom copilots and conversational AI',
    complexity: 'medium',
  },
  'dataverse': { 
    label: 'Microsoft Dataverse', 
    description: 'Secure, scalable data platform for Power Platform',
    complexity: 'low',
  },
}

// ============================================================================
// MICROSOFT 365 & COPILOT SERVICES
// ============================================================================

export type M365Service = 
  | 'm365-copilot'
  | 'copilot-for-sales'
  | 'copilot-for-service'
  | 'copilot-for-finance'
  | 'github-copilot'
  | 'sharepoint'
  | 'teams'
  | 'outlook'
  | 'viva'

export const M365_SERVICES: Record<M365Service, { label: string; description: string; complexity: ImplementationComplexity }> = {
  'm365-copilot': { 
    label: 'Microsoft 365 Copilot', 
    description: 'AI assistant across Word, Excel, PowerPoint, Outlook, Teams',
    complexity: 'low',
  },
  'copilot-for-sales': { 
    label: 'Copilot for Sales', 
    description: 'AI assistant for sales workflows in Outlook and Teams',
    complexity: 'medium',
  },
  'copilot-for-service': { 
    label: 'Copilot for Service', 
    description: 'AI assistant for customer service agents',
    complexity: 'medium',
  },
  'copilot-for-finance': { 
    label: 'Copilot for Finance', 
    description: 'AI assistant for finance professionals in Excel',
    complexity: 'low',
  },
  'github-copilot': { 
    label: 'GitHub Copilot', 
    description: 'AI-powered code completion and assistance',
    complexity: 'low',
  },
  'sharepoint': { 
    label: 'SharePoint', 
    description: 'Content management and collaboration platform',
    complexity: 'low',
  },
  'teams': { 
    label: 'Microsoft Teams', 
    description: 'Collaboration, meetings, and business communication',
    complexity: 'low',
  },
  'outlook': { 
    label: 'Microsoft Outlook', 
    description: 'Email, calendar, and contact management',
    complexity: 'low',
  },
  'viva': { 
    label: 'Microsoft Viva', 
    description: 'Employee experience platform',
    complexity: 'medium',
  },
}

// ============================================================================
// DYNAMICS 365 MODULES
// ============================================================================

export type Dynamics365Module = 
  | 'd365-sales'
  | 'd365-customer-service'
  | 'd365-field-service'
  | 'd365-finance'
  | 'd365-supply-chain'
  | 'd365-commerce'
  | 'd365-business-central'
  | 'd365-customer-insights'

export const DYNAMICS_365_MODULES: Record<Dynamics365Module, { label: string; description: string; complexity: ImplementationComplexity }> = {
  'd365-sales': { 
    label: 'Dynamics 365 Sales', 
    description: 'CRM for sales force automation and pipeline management',
    complexity: 'high',
  },
  'd365-customer-service': { 
    label: 'Dynamics 365 Customer Service', 
    description: 'Omnichannel customer support and case management',
    complexity: 'high',
  },
  'd365-field-service': { 
    label: 'Dynamics 365 Field Service', 
    description: 'Field technician scheduling and work order management',
    complexity: 'high',
  },
  'd365-finance': { 
    label: 'Dynamics 365 Finance', 
    description: 'Financial management and operations',
    complexity: 'very-high',
  },
  'd365-supply-chain': { 
    label: 'Dynamics 365 Supply Chain Management', 
    description: 'End-to-end supply chain visibility and optimization',
    complexity: 'very-high',
  },
  'd365-commerce': { 
    label: 'Dynamics 365 Commerce', 
    description: 'Unified commerce platform for retail',
    complexity: 'very-high',
  },
  'd365-business-central': { 
    label: 'Dynamics 365 Business Central', 
    description: 'ERP for small and medium businesses',
    complexity: 'high',
  },
  'd365-customer-insights': { 
    label: 'Dynamics 365 Customer Insights', 
    description: 'Customer data platform and journey orchestration',
    complexity: 'medium',
  },
}

// ============================================================================
// MICROSOFT FABRIC
// ============================================================================

export type FabricWorkload = 
  | 'fabric-data-engineering'
  | 'fabric-data-factory'
  | 'fabric-data-science'
  | 'fabric-data-warehouse'
  | 'fabric-real-time-intelligence'
  | 'fabric-power-bi'

export const FABRIC_WORKLOADS: Record<FabricWorkload, { label: string; description: string; complexity: ImplementationComplexity }> = {
  'fabric-data-engineering': { 
    label: 'Data Engineering', 
    description: 'Spark-based data transformation and lakehouse',
    complexity: 'high',
  },
  'fabric-data-factory': { 
    label: 'Data Factory', 
    description: 'Data movement and orchestration pipelines',
    complexity: 'medium',
  },
  'fabric-data-science': { 
    label: 'Data Science', 
    description: 'ML model training and experimentation',
    complexity: 'high',
  },
  'fabric-data-warehouse': { 
    label: 'Data Warehouse', 
    description: 'Enterprise data warehousing with T-SQL',
    complexity: 'medium',
  },
  'fabric-real-time-intelligence': { 
    label: 'Real-Time Intelligence', 
    description: 'Real-time analytics and event streaming',
    complexity: 'high',
  },
  'fabric-power-bi': { 
    label: 'Power BI in Fabric', 
    description: 'Integrated BI and reporting',
    complexity: 'low',
  },
}

// ============================================================================
// MICROSOFT SECURITY
// ============================================================================

export type SecurityService = 
  | 'entra-id'
  | 'defender-for-cloud'
  | 'sentinel'
  | 'purview-compliance'
  | 'intune'

export const SECURITY_SERVICES: Record<SecurityService, { label: string; description: string; complexity: ImplementationComplexity }> = {
  'entra-id': { 
    label: 'Microsoft Entra ID', 
    description: 'Identity and access management',
    complexity: 'medium',
  },
  'defender-for-cloud': { 
    label: 'Microsoft Defender for Cloud', 
    description: 'Cloud security posture management',
    complexity: 'medium',
  },
  'sentinel': { 
    label: 'Microsoft Sentinel', 
    description: 'Cloud-native SIEM and SOAR',
    complexity: 'high',
  },
  'purview-compliance': { 
    label: 'Microsoft Purview Compliance', 
    description: 'Data governance and compliance management',
    complexity: 'medium',
  },
  'intune': { 
    label: 'Microsoft Intune', 
    description: 'Endpoint management and security',
    complexity: 'medium',
  },
}

// ============================================================================
// AZURE INFRASTRUCTURE
// ============================================================================

export type AzureInfraService = 
  | 'azure-iot-hub'
  | 'azure-digital-twins'
  | 'azure-functions'
  | 'azure-logic-apps'
  | 'azure-api-management'
  | 'azure-kubernetes'
  | 'azure-container-apps'

export const AZURE_INFRA_SERVICES: Record<AzureInfraService, { label: string; description: string; complexity: ImplementationComplexity }> = {
  'azure-iot-hub': { 
    label: 'Azure IoT Hub', 
    description: 'IoT device connectivity and management',
    complexity: 'high',
  },
  'azure-digital-twins': { 
    label: 'Azure Digital Twins', 
    description: 'Live digital models of physical environments',
    complexity: 'very-high',
  },
  'azure-functions': { 
    label: 'Azure Functions', 
    description: 'Serverless compute for event-driven workloads',
    complexity: 'low',
  },
  'azure-logic-apps': { 
    label: 'Azure Logic Apps', 
    description: 'Workflow automation and integration',
    complexity: 'medium',
  },
  'azure-api-management': { 
    label: 'Azure API Management', 
    description: 'API gateway and developer portal',
    complexity: 'medium',
  },
  'azure-kubernetes': { 
    label: 'Azure Kubernetes Service', 
    description: 'Managed Kubernetes for containerized apps',
    complexity: 'high',
  },
  'azure-container-apps': { 
    label: 'Azure Container Apps', 
    description: 'Serverless containers with built-in scaling',
    complexity: 'medium',
  },
}

// ============================================================================
// REFERENCE ARCHITECTURE PATTERNS
// ============================================================================

export type ReferenceArchitecturePattern = 
  | 'conversational-ai'
  | 'document-processing'
  | 'predictive-analytics'
  | 'iot-telemetry'
  | 'digital-twin'
  | 'knowledge-mining'
  | 'process-automation'
  | 'customer-360'
  | 'supply-chain-optimization'
  | 'fraud-detection'
  | 'content-generation'
  | 'code-assistant'
  | 'agentic-ai'

export interface ReferenceArchitectureInfo {
  pattern: ReferenceArchitecturePattern
  label: string
  description: string
  primaryProducts: MicrosoftProductFamily[]
  typicalServices: string[]
  industries: string[]
  complexity: ImplementationComplexity
  agenticPotential: 'low' | 'medium' | 'high'
  msLearnUrl?: string
}

export const REFERENCE_ARCHITECTURES: Record<ReferenceArchitecturePattern, ReferenceArchitectureInfo> = {
  'conversational-ai': {
    pattern: 'conversational-ai',
    label: 'Conversational AI / Chatbot',
    description: 'AI-powered chatbots and virtual assistants for customer service, internal help desk, or specialized domain assistants',
    primaryProducts: ['azure-ai', 'power-platform'],
    typicalServices: ['azure-openai', 'azure-ai-search', 'copilot-studio', 'azure-bot-service'],
    industries: ['retail', 'financial-services', 'healthcare', 'government'],
    complexity: 'medium',
    agenticPotential: 'high',
    msLearnUrl: 'https://learn.microsoft.com/azure/architecture/ai-ml/architecture/conversational-bot',
  },
  'document-processing': {
    pattern: 'document-processing',
    label: 'Intelligent Document Processing',
    description: 'Extract, classify, and process information from documents using AI vision and language models',
    primaryProducts: ['azure-ai', 'power-platform'],
    typicalServices: ['azure-ai-document-intelligence', 'azure-openai', 'power-automate', 'azure-ai-vision'],
    industries: ['financial-services', 'healthcare', 'government', 'manufacturing'],
    complexity: 'medium',
    agenticPotential: 'medium',
    msLearnUrl: 'https://learn.microsoft.com/azure/architecture/ai-ml/architecture/automate-document-processing',
  },
  'predictive-analytics': {
    pattern: 'predictive-analytics',
    label: 'Predictive Analytics & Forecasting',
    description: 'Use ML models to predict outcomes, forecast demand, or identify patterns in historical data',
    primaryProducts: ['azure-ai', 'azure-data', 'microsoft-fabric'],
    typicalServices: ['azure-machine-learning', 'azure-synapse', 'power-bi', 'fabric-data-science'],
    industries: ['retail', 'manufacturing', 'financial-services', 'energy'],
    complexity: 'high',
    agenticPotential: 'medium',
    msLearnUrl: 'https://learn.microsoft.com/azure/architecture/ai-ml/idea/predictive-maintenance',
  },
  'iot-telemetry': {
    pattern: 'iot-telemetry',
    label: 'IoT & Telemetry Analytics',
    description: 'Collect, process, and analyze sensor data from IoT devices for monitoring and optimization',
    primaryProducts: ['azure-infrastructure', 'azure-data', 'azure-ai'],
    typicalServices: ['azure-iot-hub', 'azure-event-hubs', 'azure-stream-analytics', 'power-bi'],
    industries: ['manufacturing', 'energy', 'retail'],
    complexity: 'high',
    agenticPotential: 'medium',
    msLearnUrl: 'https://learn.microsoft.com/azure/architecture/reference-architectures/iot',
  },
  'digital-twin': {
    pattern: 'digital-twin',
    label: 'Digital Twin',
    description: 'Create virtual representations of physical assets, processes, or environments for simulation and optimization',
    primaryProducts: ['azure-infrastructure', 'azure-ai', 'azure-data'],
    typicalServices: ['azure-digital-twins', 'azure-iot-hub', 'azure-machine-learning', 'power-bi'],
    industries: ['manufacturing', 'energy', 'retail'],
    complexity: 'very-high',
    agenticPotential: 'high',
    msLearnUrl: 'https://learn.microsoft.com/azure/architecture/solution-ideas/articles/digital-twins-manufacturing',
  },
  'knowledge-mining': {
    pattern: 'knowledge-mining',
    label: 'Knowledge Mining & Search',
    description: 'Extract insights from unstructured content and enable intelligent search across documents',
    primaryProducts: ['azure-ai', 'microsoft-365'],
    typicalServices: ['azure-ai-search', 'azure-openai', 'azure-ai-document-intelligence', 'sharepoint'],
    industries: ['government', 'healthcare', 'financial-services', 'education'],
    complexity: 'medium',
    agenticPotential: 'high',
    msLearnUrl: 'https://learn.microsoft.com/azure/architecture/ai-ml/architecture/knowledge-mining-content-moderator',
  },
  'process-automation': {
    pattern: 'process-automation',
    label: 'Business Process Automation',
    description: 'Automate repetitive business processes using workflow automation and RPA',
    primaryProducts: ['power-platform', 'azure-ai'],
    typicalServices: ['power-automate', 'power-apps', 'azure-openai', 'dataverse'],
    industries: ['financial-services', 'healthcare', 'government', 'manufacturing'],
    complexity: 'low',
    agenticPotential: 'high',
    msLearnUrl: 'https://learn.microsoft.com/power-automate/guidance/planning/introduction',
  },
  'customer-360': {
    pattern: 'customer-360',
    label: 'Customer 360 & Personalization',
    description: 'Unify customer data from multiple sources to create personalized experiences and insights',
    primaryProducts: ['dynamics-365', 'azure-data', 'azure-ai'],
    typicalServices: ['d365-customer-insights', 'azure-synapse', 'azure-machine-learning', 'power-bi'],
    industries: ['retail', 'financial-services', 'telecommunications'],
    complexity: 'high',
    agenticPotential: 'high',
    msLearnUrl: 'https://learn.microsoft.com/dynamics365/customer-insights/',
  },
  'supply-chain-optimization': {
    pattern: 'supply-chain-optimization',
    label: 'Supply Chain Optimization',
    description: 'Optimize inventory, logistics, and supplier management using AI and analytics',
    primaryProducts: ['dynamics-365', 'azure-ai', 'azure-data'],
    typicalServices: ['d365-supply-chain', 'azure-machine-learning', 'power-bi', 'azure-synapse'],
    industries: ['manufacturing', 'retail', 'energy'],
    complexity: 'very-high',
    agenticPotential: 'medium',
    msLearnUrl: 'https://learn.microsoft.com/dynamics365/supply-chain/',
  },
  'fraud-detection': {
    pattern: 'fraud-detection',
    label: 'Fraud Detection & Risk Analytics',
    description: 'Detect anomalies and fraudulent patterns in transactions using ML models',
    primaryProducts: ['azure-ai', 'azure-data', 'dynamics-365'],
    typicalServices: ['azure-machine-learning', 'azure-synapse', 'azure-stream-analytics', 'power-bi'],
    industries: ['financial-services', 'retail', 'government'],
    complexity: 'high',
    agenticPotential: 'medium',
    msLearnUrl: 'https://learn.microsoft.com/azure/architecture/example-scenario/ai/fraud-detection',
  },
  'content-generation': {
    pattern: 'content-generation',
    label: 'Content Generation & Summarization',
    description: 'Generate, summarize, or transform content using generative AI models',
    primaryProducts: ['azure-ai', 'microsoft-365'],
    typicalServices: ['azure-openai', 'm365-copilot', 'azure-ai-language'],
    industries: ['retail', 'financial-services', 'education', 'telecommunications'],
    complexity: 'medium',
    agenticPotential: 'high',
    msLearnUrl: 'https://learn.microsoft.com/azure/ai-services/openai/concepts/use-cases',
  },
  'code-assistant': {
    pattern: 'code-assistant',
    label: 'Developer Productivity & Code Assistant',
    description: 'Accelerate software development with AI-powered code completion and assistance',
    primaryProducts: ['microsoft-365', 'azure-ai'],
    typicalServices: ['github-copilot', 'azure-openai', 'azure-ai-studio'],
    industries: ['telecommunications', 'financial-services', 'retail', 'manufacturing'],
    complexity: 'low',
    agenticPotential: 'high',
    msLearnUrl: 'https://docs.github.com/copilot',
  },
  'agentic-ai': {
    pattern: 'agentic-ai',
    label: 'Agentic AI / Autonomous Agents',
    description: 'Build autonomous AI agents that can reason, plan, and execute multi-step tasks with tool use',
    primaryProducts: ['azure-ai', 'power-platform'],
    typicalServices: ['azure-openai', 'azure-ai-studio', 'copilot-studio', 'azure-functions'],
    industries: ['financial-services', 'retail', 'healthcare', 'manufacturing'],
    complexity: 'high',
    agenticPotential: 'high',
    msLearnUrl: 'https://learn.microsoft.com/azure/ai-studio/concepts/agents',
  },
}

// ============================================================================
// SOLUTION MAPPING TYPES
// ============================================================================

export type SolutionRole = 'primary' | 'supporting' | 'integration'

export interface MicrosoftSolutionMapping {
  productFamily: MicrosoftProductFamily
  services: string[]
  role: SolutionRole
  justification?: string
}

// ============================================================================
// AGENTIC AI OPPORTUNITY TYPES
// ============================================================================

export type AgentCapability = 
  | 'reasoning'
  | 'planning'
  | 'tool-use'
  | 'memory'
  | 'multi-step-execution'
  | 'human-in-loop'
  | 'autonomous-decision'

export interface AgenticAIOpportunity {
  id: string
  title: string
  description: string
  agentType: 'task-agent' | 'orchestrator-agent' | 'specialist-agent' | 'assistant-agent'
  capabilities: AgentCapability[]
  humanOversight: 'none' | 'approval' | 'review' | 'supervision'
  automationLevel: 'assisted' | 'semi-autonomous' | 'autonomous'
  tools: string[]
  estimatedEffort: ImplementationComplexity
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getAllServicesForFamily(family: MicrosoftProductFamily): { id: string; label: string; description: string; complexity: ImplementationComplexity }[] {
  switch (family) {
    case 'azure-ai':
      return Object.entries(AZURE_AI_SERVICES).map(([id, info]) => ({ id, ...info }))
    case 'azure-data':
      return Object.entries(AZURE_DATA_SERVICES).map(([id, info]) => ({ id, ...info }))
    case 'azure-infrastructure':
      return Object.entries(AZURE_INFRA_SERVICES).map(([id, info]) => ({ id, ...info }))
    case 'power-platform':
      return Object.entries(POWER_PLATFORM_SERVICES).map(([id, info]) => ({ id, ...info }))
    case 'microsoft-365':
      return Object.entries(M365_SERVICES).map(([id, info]) => ({ id, ...info }))
    case 'dynamics-365':
      return Object.entries(DYNAMICS_365_MODULES).map(([id, info]) => ({ id, ...info }))
    case 'microsoft-fabric':
      return Object.entries(FABRIC_WORKLOADS).map(([id, info]) => ({ id, ...info }))
    case 'microsoft-security':
      return Object.entries(SECURITY_SERVICES).map(([id, info]) => ({ id, ...info }))
    default:
      return []
  }
}

export function getServiceLabel(serviceId: string): string {
  const allServices: Record<string, { label: string }> = {
    ...AZURE_AI_SERVICES,
    ...AZURE_DATA_SERVICES,
    ...AZURE_INFRA_SERVICES,
    ...POWER_PLATFORM_SERVICES,
    ...M365_SERVICES,
    ...DYNAMICS_365_MODULES,
    ...FABRIC_WORKLOADS,
    ...SECURITY_SERVICES,
  }
  return allServices[serviceId]?.label || serviceId
}

export function getServiceComplexity(serviceId: string): ImplementationComplexity {
  const allServices: Record<string, { complexity: ImplementationComplexity }> = {
    ...AZURE_AI_SERVICES,
    ...AZURE_DATA_SERVICES,
    ...AZURE_INFRA_SERVICES,
    ...POWER_PLATFORM_SERVICES,
    ...M365_SERVICES,
    ...DYNAMICS_365_MODULES,
    ...FABRIC_WORKLOADS,
    ...SECURITY_SERVICES,
  }
  return allServices[serviceId]?.complexity || 'medium'
}

export function calculateOverallComplexity(services: string[]): ImplementationComplexity {
  if (services.length === 0) return 'low'
  
  const complexityOrder: ImplementationComplexity[] = ['low', 'medium', 'high', 'very-high']
  const complexities = services.map(s => getServiceComplexity(s))
  const maxComplexityIndex = Math.max(...complexities.map(c => complexityOrder.indexOf(c)))
  
  // Increase complexity based on number of services
  let adjustedIndex = maxComplexityIndex
  if (services.length >= 6) adjustedIndex = Math.min(adjustedIndex + 2, 3)
  else if (services.length >= 4) adjustedIndex = Math.min(adjustedIndex + 1, 3)
  
  return complexityOrder[adjustedIndex]
}

export function getRecommendedArchitectures(industry: string): ReferenceArchitectureInfo[] {
  return Object.values(REFERENCE_ARCHITECTURES).filter(arch => 
    arch.industries.includes(industry)
  )
}

export function getAgenticArchitectures(): ReferenceArchitectureInfo[] {
  return Object.values(REFERENCE_ARCHITECTURES).filter(arch => 
    arch.agenticPotential === 'high'
  )
}
