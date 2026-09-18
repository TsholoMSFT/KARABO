export const FRONTIER_CATALOG_VERSION = '2026.04-v1'

export type FrontierReadinessRating = 0 | 1 | 2 | 3 | 4

export type FrontierPillarId =
  | 'ai_platform'
  | 'database_platform'
  | 'application_platform'
  | 'secure_the_solution'
  | 'secure_the_user'
  | 'm365_copilot'
  | 'copilot_chat'
  | 'copilot_studio'
  | 'github_copilot'

export type FrontierReadinessRatings = Record<FrontierPillarId, FrontierReadinessRating>

export type FrontierMaturityStage =
  | 'Exploring'
  | 'Planning'
  | 'Implementing'
  | 'Scaling'
  | 'Realizing'

export type FrontierDeliveryStage = 'Envision' | 'Architect' | 'Build' | 'Govern' | 'Scale'
export type FrontierWorkstreamId = 'shared' | 'trusted' | 'agentify'
export type FrontierOfferingId =
  | '01' | '02' | '03' | '04' | '05'
  | '06' | '07' | '08' | '09' | '10'
  | '11' | '12' | '13' | '14' | '15'

export interface FrontierPillarDefinition {
  id: FrontierPillarId
  name: string
  description: string
  group: FrontierWorkstreamId
  isAiPillar: boolean
}

export interface FrontierOfferingDefinition {
  id: FrontierOfferingId
  name: string
  stage: FrontierDeliveryStage
  duration: string
  publicationStatus: 'published' | 'draft'
  internalEffortTier?: 'T1' | 'T2' | 'T3'
  linkedPillars: readonly FrontierPillarId[]
  purpose: string
  bestFor: string
  audience: readonly string[]
  prerequisites: readonly string[]
  microsoftPlatforms: readonly string[]
  microsoftDelivers: readonly string[]
  customerCommits: readonly string[]
  focusAreas: readonly string[]
  deliverables: readonly string[]
  outcomes: readonly string[]
}

export const FRONTIER_PILLARS: readonly FrontierPillarDefinition[] = [
  {
    id: 'ai_platform',
    name: 'AI Platform',
    description: 'Azure AI Foundry, Azure OpenAI, AI Services, and Model-as-a-Service.',
    group: 'trusted',
    isAiPillar: true,
  },
  {
    id: 'database_platform',
    name: 'Database Platform',
    description: 'Cosmos DB, Azure SQL Database, and open-source databases.',
    group: 'trusted',
    isAiPillar: false,
  },
  {
    id: 'application_platform',
    name: 'Application Platform',
    description: 'App Services, containers, serverless, and integration services.',
    group: 'trusted',
    isAiPillar: false,
  },
  {
    id: 'secure_the_solution',
    name: 'Secure the Solution',
    description: 'Data and workload security attached to the solution.',
    group: 'shared',
    isAiPillar: false,
  },
  {
    id: 'secure_the_user',
    name: 'Secure the User',
    description: 'Identity, endpoint protection, and information protection for users.',
    group: 'shared',
    isAiPillar: true,
  },
  {
    id: 'm365_copilot',
    name: 'Microsoft 365 Copilot',
    description: 'Role-based adoption of Microsoft 365 Copilot.',
    group: 'agentify',
    isAiPillar: true,
  },
  {
    id: 'copilot_chat',
    name: 'Copilot Chat',
    description: 'Active use of Microsoft 365 Copilot Chat.',
    group: 'agentify',
    isAiPillar: true,
  },
  {
    id: 'copilot_studio',
    name: 'Copilot Studio',
    description: 'Custom agent experiences built and operated with Copilot Studio.',
    group: 'agentify',
    isAiPillar: true,
  },
  {
    id: 'github_copilot',
    name: 'GitHub Copilot',
    description: 'Secure, measured GitHub Copilot adoption across engineering teams.',
    group: 'agentify',
    isAiPillar: true,
  },
]

export const FRONTIER_WORKSTREAM_SEQUENCES: Record<FrontierWorkstreamId, readonly FrontierOfferingId[]> = {
  shared: ['01', '03', '07', '09', '10'],
  trusted: ['13', '04', '12', '08', '05', '06'],
  agentify: ['02', '11', '15', '14'],
}

export const FRONTIER_WORKSTREAM_LABELS: Record<FrontierWorkstreamId, string> = {
  shared: 'Shared Foundation',
  trusted: 'Trusted Intelligence',
  agentify: 'Agentify Your Business',
}

export const FRONTIER_MATURITY_DESCRIPTIONS: Record<FrontierMaturityStage, string> = {
  Exploring: 'Educating and experimenting in select areas. Lead with envisioning to set ambition.',
  Planning: 'Defining an AI strategy and first proofs of concept. Firm up the strategy and initial bets.',
  Implementing: 'Moving proofs of concept into production. Architect, govern, and build the first production workloads.',
  Scaling: 'Expanding deployments across functions. Govern for throughput, consistency, and scale.',
  Realizing: 'Delivering repeatable, measurable value with strong governance and enterprise-wide scale.',
}

const offering = (definition: FrontierOfferingDefinition): FrontierOfferingDefinition => definition

export const FRONTIER_OFFERINGS: Record<FrontierOfferingId, FrontierOfferingDefinition> = {
  '01': offering({
    id: '01',
    name: 'Frontier AI Executive Envisioning',
    stage: 'Envision',
    duration: '1 day on-site',
    publicationStatus: 'published',
    internalEffortTier: 'T1',
    linkedPillars: [],
    purpose: 'Align the executive committee on what reimagining the business with AI and agents means, then prioritize the highest-conviction bets.',
    bestFor: 'Customers with AI capabilities in production who are ready to move from isolated productivity gains to redesigning how the business operates.',
    audience: ['CEO', 'CFO', 'COO', 'CIO', 'Chief Strategy Officer', 'Chief AI Officer', 'Business unit leaders'],
    prerequisites: ['Executive sponsor confirmed', 'Relevant business strategy shared in advance', 'Executive pre-read completed'],
    microsoftPlatforms: ['Microsoft 365 Copilot', 'Azure AI Foundry', 'Copilot Studio'],
    microsoftDelivers: ['Industry specialist', 'Innovation Hub lead', 'AI strategist'],
    customerCommits: ['Executive team participation', 'Sponsor preparation and follow-through'],
    focusAreas: [
      'Industry AI disruption and competitor signals',
      'Value-chain opportunities for agents',
      'Reimagine bets and frontier opportunities',
      'Critical success indicators',
      'Investment shape, sequencing, and sponsorship',
    ],
    deliverables: ['Reimagine opportunity map', 'Top bets brief with value hypothesis and owner', '90-day mobilization plan'],
    outcomes: ['Executive alignment on the highest-conviction bets', 'Named accountable sponsor per bet', 'Agreed path into the next engagement'],
  }),
  '02': offering({
    id: '02',
    name: 'Agentic Workflow Discovery Sprint',
    stage: 'Envision',
    duration: '2 weeks',
    publicationStatus: 'published',
    internalEffortTier: 'T2',
    linkedPillars: ['copilot_studio', 'github_copilot'],
    purpose: 'Translate executive ambition into a scored and sequenced portfolio of agentic workflows ready to enter build.',
    bestFor: 'Customers that need to turn promising ideas into a defensible agent backlog with clear business cases.',
    audience: ['Business process owners', 'Operations leaders', 'IT delivery', 'Finance partner', 'AI leadership'],
    prerequisites: ['Candidate workflows identified', 'Process, architecture, and data owners available', 'AI governance baseline established or planned'],
    microsoftPlatforms: ['Microsoft 365 Copilot', 'Copilot Studio', 'Azure AI Foundry', 'Power Platform', 'Agent observability services'],
    microsoftDelivers: ['AI strategist', 'Industry specialist', 'Solution architect', 'Data and AI specialist'],
    customerCommits: ['Process owner participation', 'Data engineering support', 'Business-case owner'],
    focusAreas: ['Workflow teardown', 'Human and agent role design', 'Quantified business cases', 'Build-versus-buy and platform-fit decisions'],
    deliverables: ['Scored agentic workflow backlog', 'Top workflow design briefs', 'Build-versus-buy and platform-fit analysis'],
    outcomes: ['Defensible agent backlog', 'Priority workflows approved for build', 'Agreed platform standards'],
  }),
  '03': offering({
    id: '03',
    name: 'Industry Reimagine Lab',
    stage: 'Envision',
    duration: '2 days on-site',
    publicationStatus: 'published',
    internalEffortTier: 'T1',
    linkedPillars: [],
    purpose: 'Use industry-specific frontier patterns to identify where the customer can differentiate and create new value.',
    bestFor: 'Customers seeking industry context before committing investment or choosing where to differentiate.',
    audience: ['Industry executive team', 'Business unit leaders', 'Digital leaders', 'Customer experience leaders'],
    prerequisites: ['One target industry agreed', 'Customer strategy shared in advance'],
    microsoftPlatforms: ['Microsoft 365 Copilot', 'Azure AI Foundry', 'Azure AI Search', 'Microsoft Fabric', 'Partner solutions'],
    microsoftDelivers: ['Industry lead', 'Innovation Hub lead', 'Relevant partner specialist'],
    customerCommits: ['Industry leadership participation'],
    focusAreas: ['Industry reimagine patterns', 'Customer-relevant demonstrations', 'Competitor benchmarking', 'Tailored opportunity identification'],
    deliverables: ['Industry reimagine pattern pack', 'Tailored opportunity shortlist', 'Recommended next engagement'],
    outcomes: ['Sharper understanding of industry frontier patterns', 'Faster investment conviction', 'Stronger competitive positioning'],
  }),
  '04': offering({
    id: '04',
    name: 'AI-Native Application Architecture Lab',
    stage: 'Architect',
    duration: '3 days on-site',
    publicationStatus: 'published',
    internalEffortTier: 'T2',
    linkedPillars: ['ai_platform'],
    purpose: 'Define reusable patterns, standards, and reference designs for secure AI-native applications.',
    bestFor: 'Customers that have shipped pilots and now need to standardize enterprise AI application design and operations.',
    audience: ['Enterprise architects', 'Principal engineers', 'Security architects', 'Platform engineering leads', 'Data leaders'],
    prerequisites: ['Current-state architecture available', 'Production AI workloads available for review', 'Architecture leadership committed'],
    microsoftPlatforms: ['Azure AI Foundry', 'Copilot Studio', 'Azure OpenAI', 'Azure AI Search', 'Microsoft Fabric', 'Microsoft Purview', 'GitHub'],
    microsoftDelivers: ['Principal solution architect', 'AI platform specialist', 'Security architect'],
    customerCommits: ['Architecture team participation', 'Product engineering participation'],
    focusAreas: ['AI-native reference patterns', 'Platform selection', 'Grounding architecture', 'Identity, security, observability, and cost governance', 'Platform golden paths'],
    deliverables: ['Target-state AI-native reference architecture', 'Platform decision log', '12-week platform engineering roadmap'],
    outcomes: ['Codified architecture standards', 'Reduced rework and platform sprawl', 'Aligned paved-road approach'],
  }),
  '05': offering({
    id: '05',
    name: 'Multi-Agent Orchestration Hackathon',
    stage: 'Build',
    duration: '3 days on-site',
    publicationStatus: 'published',
    internalEffortTier: 'T1',
    linkedPillars: ['ai_platform'],
    purpose: 'Build a working multi-agent prototype around a real business scenario while upskilling the customer engineering team.',
    bestFor: 'Customers with engineering capacity that want hands-on validation and velocity.',
    audience: ['Developers', 'Machine learning engineers', 'Integration leads', 'Business scenario owners'],
    prerequisites: ['Candidate scenarios scoped', 'Development environment and access available', 'Engineering team committed'],
    microsoftPlatforms: ['Azure AI Foundry Agent Service', 'Azure OpenAI', 'Azure AI Search', 'Semantic Kernel', 'AutoGen', 'GitHub'],
    microsoftDelivers: ['Cloud solution architect', 'AI engineer', 'Industry specialist'],
    customerCommits: ['Engineering team participation', 'Business owner per scenario'],
    focusAreas: ['Multi-agent orchestration patterns', 'Tool use and grounded retrieval', 'Agent handoffs', 'Evaluation, observability, and guardrails'],
    deliverables: ['Working multi-agent prototype', 'Evaluation harness', 'Productionization checklist and ownership map'],
    outcomes: ['Engineering team upskilled', 'Sponsor-ready prototype', 'Clear go or no-go decision for MVP investment'],
  }),
  '06': offering({
    id: '06',
    name: 'AI MVP Factory',
    stage: 'Build',
    duration: '6-8 weeks per MVP',
    publicationStatus: 'published',
    internalEffortTier: 'T3',
    linkedPillars: ['ai_platform', 'application_platform'],
    purpose: 'Take a prioritized workflow from design brief to a production-ready MVP used by a pilot business unit.',
    bestFor: 'Customers with a prioritized workflow, named sponsor, and committed pilot team.',
    audience: ['Product owner', 'Business owner', 'Engineers', 'Change lead', 'Pilot users'],
    prerequisites: ['Prioritized workflow and business case', 'Data, identity, and platform foundations', 'Committed pilot business unit'],
    microsoftPlatforms: ['Azure AI Foundry', 'Copilot Studio', 'Microsoft 365 Copilot extensibility', 'Microsoft Fabric', 'Microsoft Purview', 'GitHub Actions'],
    microsoftDelivers: ['Engagement lead', 'Solution architect', 'AI engineers', 'Adoption specialist'],
    customerCommits: ['Dedicated product owner', 'Engineering pod', 'Change lead', 'Pilot users'],
    focusAreas: ['Production-grade agent delivery', 'Grounding and evaluation', 'Pilot adoption', 'Monitoring, FinOps, support, and handover'],
    deliverables: ['Production-ready pilot MVP', 'Continuous evaluation framework', 'Adoption and handover pack', 'Next-wave scale plan'],
    outcomes: ['Production agent with measured outcome', 'Reusable components for subsequent work', 'Customer team prepared to run the next MVP'],
  }),
  '07': offering({
    id: '07',
    name: 'Enterprise AI Transformation Blueprint',
    stage: 'Architect',
    duration: '4-6 weeks',
    publicationStatus: 'published',
    internalEffortTier: 'T2',
    linkedPillars: [],
    purpose: 'Create a multi-year AI strategy and operating plan that aligns business outcomes, technology, people, investment, and governance.',
    bestFor: 'Customers with executive AI ambition that need an integrated execution and investment plan.',
    audience: ['CIO', 'CTO', 'Chief AI Officer', 'CHRO', 'CFO', 'Chief Risk Officer', 'Transformation office'],
    prerequisites: ['Executive sponsor assigned', 'Current strategy and plans available', 'Cross-functional steering group formed'],
    microsoftPlatforms: ['Full Microsoft AI capability map'],
    microsoftDelivers: ['AI strategist', 'Industry lead', 'Architecture principal', 'Change advisor'],
    customerCommits: ['Cross-functional steering committee participation'],
    focusAreas: ['Three-year ambition and outcomes', 'Capability roadmap', 'Operating model and governance', 'Investment and portfolio sequencing', 'Risk and regulatory positioning'],
    deliverables: ['Board-ready transformation blueprint', 'Three-year capability roadmap', 'Governance and talent recommendations', 'Year-one execution plan'],
    outcomes: ['Committed transformation plan', 'Aligned investment, talent, and risk decisions', 'Mobilized year-one portfolio'],
  }),
  '08': offering({
    id: '08',
    name: 'Responsible AI & Agent Governance Accelerator',
    stage: 'Govern',
    duration: '2-3 weeks',
    publicationStatus: 'published',
    internalEffortTier: 'T2',
    linkedPillars: ['secure_the_solution', 'secure_the_user'],
    purpose: 'Establish or strengthen the governance, risk, and assurance framework needed to scale AI and agents responsibly.',
    bestFor: 'Customers approaching production scale that need defensible governance for boards, risk functions, and regulators.',
    audience: ['Chief Risk Officer', 'CISO', 'Chief Privacy Officer', 'Legal counsel', 'Internal audit', 'AI governance lead'],
    prerequisites: ['Risk and security functions engaged', 'Inventory of active AI workloads'],
    microsoftPlatforms: ['Microsoft Purview', 'Defender for Cloud', 'Microsoft Entra', 'Azure AI Content Safety', 'Azure AI Foundry evaluation'],
    microsoftDelivers: ['Responsible AI lead', 'Security architect', 'Compliance specialist'],
    customerCommits: ['Risk, security, privacy, and legal participation'],
    focusAreas: ['AI risk taxonomy and controls', 'Agent lifecycle governance', 'Identity, data, and content governance', 'Regulatory mapping', 'Assurance and audit readiness'],
    deliverables: ['Responsible AI and agent governance framework', 'Risk-tiered control library', 'Governance tooling architecture', 'Audit and assurance plan'],
    outcomes: ['Defensible governance', 'Reduced friction between innovation and risk', 'Faster and safer production path'],
  }),
  '09': offering({
    id: '09',
    name: 'AI Operating Model & Org Design Workshop',
    stage: 'Govern',
    duration: '3 days',
    publicationStatus: 'published',
    internalEffortTier: 'T1',
    linkedPillars: [],
    purpose: 'Redesign structures, roles, talent, and incentives for an AI-native operating model.',
    bestFor: 'Customers whose AI strategy is set but whose organization and talent model still constrain execution.',
    audience: ['CEO', 'COO', 'CHRO', 'CIO', 'Transformation lead', 'Business unit leaders'],
    prerequisites: ['AI ambition or blueprint established', 'CHRO and COO participation'],
    microsoftPlatforms: ['Microsoft Viva', 'Microsoft 365 Copilot', 'Microsoft Learn'],
    microsoftDelivers: ['Organization change advisor', 'AI strategist', 'HR partner'],
    customerCommits: ['Executive and business unit leader participation'],
    focusAreas: ['Operating-model archetypes', 'Role evolution', 'Talent and reskilling', 'Incentives, performance, and culture'],
    deliverables: ['Recommended operating model', 'Role evolution map', 'Talent and reskilling plan', 'Change activation roadmap'],
    outcomes: ['Executive operating-model decision', 'People plan tied to transformation', 'Reduced execution risk'],
  }),
  '10': offering({
    id: '10',
    name: 'Frontier AI Scale Program',
    stage: 'Scale',
    duration: '6-12 months',
    publicationStatus: 'published',
    internalEffortTier: 'T3',
    linkedPillars: [],
    purpose: 'Scale proven AI value across the enterprise with sustainable platform, governance, adoption, and operating capabilities.',
    bestFor: 'Customers with measured production AI outcomes and executive ambition to lead their sector.',
    audience: ['Executive sponsor', 'Program executive', 'Transformation office', 'Business unit leaders', 'AI platform leadership'],
    prerequisites: ['Production agent with measured outcome', 'Funded program and executive sponsor', 'Governance baseline'],
    microsoftPlatforms: ['Azure AI Foundry', 'Copilot Studio', 'Microsoft 365 Copilot', 'Microsoft Fabric', 'Microsoft Purview', 'Microsoft Defender', 'GitHub'],
    microsoftDelivers: ['Program executive', 'Engagement lead', 'Solution architects', 'AI engineers', 'Industry and adoption specialists'],
    customerCommits: ['Dedicated program team', 'Funded portfolio', 'Executive sponsorship'],
    focusAreas: ['Portfolio expansion', 'Platform productization', 'Value capture and adoption', 'AI center of excellence', 'Industry leadership narrative'],
    deliverables: ['Scaled production portfolio', 'Operating AI center of excellence', 'Self-service AI platform paths', 'Business-outcome reporting cadence', 'Reference assets'],
    outcomes: ['Sustained enterprise AI impact', 'Industry reference position', 'Self-sufficient customer capability'],
  }),
  '11': offering({
    id: '11',
    name: 'AI Ready Employee Productivity & Security Activation Sprint',
    stage: 'Govern',
    duration: '2-3 weeks',
    publicationStatus: 'published',
    internalEffortTier: 'T2',
    linkedPillars: ['m365_copilot', 'copilot_chat', 'secure_the_user'],
    purpose: 'Move from isolated employee AI experimentation to secure, role-based adoption at enterprise scale.',
    bestFor: 'Customers rolling out employee-facing AI who need role-based activation, data access hygiene, and secure guardrails.',
    audience: ['CIO', 'CISO', 'HR lead', 'Digital workplace owner', 'Change lead', 'Business-function leaders'],
    prerequisites: ['Named workplace or Copilot owner', 'Initial rollout scope defined', 'Security and data governance stakeholders available'],
    microsoftPlatforms: ['Microsoft 365 Copilot', 'Copilot Studio', 'Microsoft Entra', 'Microsoft Purview', 'Microsoft Defender', 'Microsoft Viva'],
    microsoftDelivers: ['Modern Work specialist', 'Security architect', 'Adoption and change lead'],
    customerCommits: ['Digital workplace lead', 'Security counterpart', 'Change owner', 'Role champions'],
    focusAreas: ['Role-based scenarios and value', 'Secure adoption controls', 'Data access and information protection', 'Champion and enablement activation'],
    deliverables: ['Role-based readiness assessment', 'Secure activation plan', 'Scenario and prompt pack', 'Change and adoption playbook'],
    outcomes: ['Safer and faster employee adoption', 'Linked productivity and security outcomes', 'Confidence to scale role-based AI'],
  }),
  '12': offering({
    id: '12',
    name: 'Application Modernization for AI Workshop',
    stage: 'Architect',
    duration: '3-4 weeks',
    publicationStatus: 'published',
    internalEffortTier: 'T2',
    linkedPillars: ['application_platform'],
    purpose: 'Identify and sequence application, integration, API, and legacy-platform modernization needed for AI-native operations.',
    bestFor: 'Customers whose fragmented application estate or brittle integrations constrain agentic delivery.',
    audience: ['CIO', 'CTO', 'Enterprise architecture lead', 'Application portfolio owner', 'Integration lead', 'Transformation office'],
    prerequisites: ['Application portfolio available', 'Application and integration owners assigned', 'Target AI scenarios identified'],
    microsoftPlatforms: ['Azure Integration Services', 'Azure API Management', 'GitHub', 'Azure Kubernetes Service', 'Microsoft Fabric', 'Azure AI Foundry', 'Power Platform'],
    microsoftDelivers: ['Application innovation architect', 'Integration specialist', 'AI platform architect'],
    customerCommits: ['Enterprise architecture team', 'Application owners', 'Integration lead', 'Modernization sponsor'],
    focusAreas: ['Legacy constraints', 'API and event readiness', 'Modernization prioritization', 'Coordination with AI build opportunities'],
    deliverables: ['AI modernization dependency map', 'Retire/refactor/wrap/replace decision log', '12-month modernization roadmap', 'Executive blocker summary'],
    outcomes: ['Modernization agenda tied to AI ambition', 'Stronger modernization investment case', 'Lower delivery risk from legacy constraints'],
  }),
  '13': offering({
    id: '13',
    name: 'Data Grounding & Fabric Readiness Lab',
    stage: 'Architect',
    duration: '3 weeks',
    publicationStatus: 'published',
    internalEffortTier: 'T2',
    linkedPillars: ['database_platform', 'ai_platform'],
    purpose: 'Make the governed data and knowledge estate operationally ready for grounded AI and agent experiences.',
    bestFor: 'Customers with fragmented data sources, knowledge estates, or weak grounding practices.',
    audience: ['Chief Data Officer', 'Data engineering lead', 'AI platform owner', 'Information governance lead', 'Enterprise architect'],
    prerequisites: ['AI use cases identified', 'Data and governance stakeholders available', 'Architecture or source inventory available'],
    microsoftPlatforms: ['Microsoft Fabric', 'Microsoft Purview', 'Azure AI Search', 'Azure AI Foundry', 'Microsoft 365 Copilot grounding'],
    microsoftDelivers: ['Data and AI architect', 'Fabric specialist', 'Information governance specialist'],
    customerCommits: ['Data engineering lead', 'Governance owner', 'AI platform counterpart'],
    focusAreas: ['Grounding-quality diagnostics', 'Retrieval and semantic readiness', 'Fabric and Purview readiness', 'Operational data-estate improvements'],
    deliverables: ['Grounding readiness assessment', 'Data and retrieval architecture recommendations', 'Fabric and Purview action plan', 'Governed data activation roadmap'],
    outcomes: ['Improved grounding quality', 'Reduced downstream rework', 'Clear path from governed data to production AI value'],
  }),
  '14': offering({
    id: '14',
    name: 'Frontline & Workforce Experience Agent Lab',
    stage: 'Envision',
    duration: '2 weeks',
    publicationStatus: 'published',
    internalEffortTier: 'T2',
    linkedPillars: ['copilot_studio'],
    purpose: 'Design role-relevant, secure AI and agent experiences for frontline, service, field, and operations teams.',
    bestFor: 'Customers that need to demonstrate credible value and adoption beyond knowledge workers.',
    audience: ['Frontline leaders', 'Operations leaders', 'Digital workplace owner', 'Change lead', 'Security representative', 'Role champions'],
    prerequisites: ['Employee-facing AI available or planned', 'Named workplace and operations sponsors', 'Security stakeholders available', 'Candidate roles identified'],
    microsoftPlatforms: ['Microsoft 365 Copilot', 'Copilot Studio', 'Microsoft Teams', 'Microsoft Viva', 'Microsoft Entra', 'Microsoft Purview', 'Microsoft Defender'],
    microsoftDelivers: ['Modern Work specialist', 'Frontline industry specialist', 'Adoption lead', 'Security architect'],
    customerCommits: ['Operations leaders', 'Role champions', 'Digital workplace lead', 'Security counterpart'],
    focusAreas: ['Frontline scenarios', 'Role-based value hypotheses', 'Secure role-based controls', 'Change and enablement', 'Adoption and impact measurement'],
    deliverables: ['Frontline scenario shortlist', 'Role-based scenario and prompt packs', 'Secure activation plan', 'Adoption and impact framework'],
    outcomes: ['Credible role-relevant AI value', 'Secure adoption path beyond knowledge workers', 'Readiness for broader productivity activation'],
  }),
  '15': offering({
    id: '15',
    name: 'GitHub Copilot Developer Productivity Activation',
    stage: 'Build',
    duration: 'To be confirmed',
    publicationStatus: 'draft',
    internalEffortTier: 'T2',
    linkedPillars: ['github_copilot'],
    purpose: 'Enable secure GitHub Copilot adoption and measured developer-productivity improvement across engineering teams.',
    bestFor: 'Internal sequencing only until the customer-ready offering is documented.',
    audience: [],
    prerequisites: [],
    microsoftPlatforms: ['GitHub Copilot'],
    microsoftDelivers: [],
    customerCommits: [],
    focusAreas: [],
    deliverables: [],
    outcomes: [],
  }),
}

export const FRONTIER_PILLAR_OFFERINGS: Record<FrontierPillarId, readonly FrontierOfferingId[]> = {
  ai_platform: ['13', '04'],
  database_platform: ['13'],
  application_platform: ['12'],
  secure_the_solution: ['08'],
  secure_the_user: ['08', '11'],
  m365_copilot: ['11'],
  copilot_chat: ['11'],
  copilot_studio: ['14', '02'],
  github_copilot: ['15', '02'],
}