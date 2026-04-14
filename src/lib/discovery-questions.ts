import { DiscoveryQuestion, Industry } from './types'

export type DiscoveryTrack = 'use-case' | 'ai-assessment' | 'infrastructure' | 'modern-work' | 'full-portfolio'

export const DISCOVERY_TRACK_LABELS: Record<DiscoveryTrack, string> = {
  'use-case': 'AI & Innovation Use Cases',
  'ai-assessment': 'AI Assessment (Deep Dive)',
  'infrastructure': 'Infrastructure & Migration',
  'modern-work': 'Modern Work & Security',
  'full-portfolio': 'Full Portfolio (ATS)',
}

export const DISCOVERY_TRACK_DESCRIPTIONS: Record<DiscoveryTrack, string> = {
  'use-case': '8 guided questions to identify AI and innovation use cases — ideal for Innovation Hub sessions',
  'ai-assessment': '24 deep questions covering AI architecture, data, models, infra, security, and governance',
  'infrastructure': '8 questions focused on datacenter, migration, hybrid connectivity, and workload modernization',
  'modern-work': '8 questions on M365 adoption, Copilot readiness, identity, security posture, and endpoint management',
  'full-portfolio': '12 questions spanning AI, infrastructure, modern work, and security — ideal for ATS account intake',
}

export const industryLabels: Record<Industry, string> = {
  general: 'General / Cross-Industry',
  healthcare: 'Healthcare & Life Sciences',
  'financial-services': 'Financial Services & Banking',
  manufacturing: 'Manufacturing & Supply Chain',
  retail: 'Retail & Consumer Goods',
  government: 'Government & Public Sector',
  education: 'Education & Research',
  energy: 'Energy & Utilities',
  telecommunications: 'Telecommunications & Media',
  'technology-software': 'Technology & Software',
}

export const discoveryQuestions: DiscoveryQuestion[] = [
  {
    id: 'q1',
    question: 'What are the primary business objectives or goals you want to achieve?',
    category: 'business',
    placeholder: 'E.g., Increase operational efficiency, reduce costs, improve customer satisfaction...',
  },
  {
    id: 'q2',
    question: 'What are the biggest pain points or challenges your organization currently faces?',
    category: 'challenges',
    placeholder: 'E.g., Manual processes, data silos, slow response times...',
  },
  {
    id: 'q3',
    question: 'Who are the primary users or stakeholders who would benefit from innovation?',
    category: 'users',
    placeholder: 'E.g., Customer service teams, operations staff, executives...',
  },
  {
    id: 'q4',
    question: 'What existing systems or technologies are currently in use?',
    category: 'technical',
    placeholder: 'E.g., CRM platforms, ERP systems, legacy databases...',
  },
  {
    id: 'q5',
    question: 'What processes or workflows take the most time or resources?',
    category: 'challenges',
    placeholder: 'E.g., Document review, data entry, approval workflows...',
  },
  {
    id: 'q6',
    question: 'What data sources or information do you have available?',
    category: 'technical',
    placeholder: 'E.g., Customer data, transaction history, operational logs...',
  },
  {
    id: 'q7',
    question: 'What would success look like for your organization in the next 6-12 months?',
    category: 'business',
    placeholder: 'E.g., 30% faster processing, 50% cost reduction, improved compliance...',
  },
  {
    id: 'q8',
    question: 'Are there any regulatory or compliance requirements to consider?',
    category: 'challenges',
    placeholder: 'E.g., GDPR, HIPAA, industry-specific regulations...',
  },
  {
    id: 'healthcare-q1',
    question: 'What are your primary patient care or clinical workflow challenges?',
    category: 'challenges',
    placeholder: 'E.g., Patient wait times, care coordination, diagnostic accuracy, medication management...',
    industries: ['healthcare'],
  },
  {
    id: 'healthcare-q2',
    question: 'How do you currently manage electronic health records (EHR) and patient data?',
    category: 'technical',
    placeholder: 'E.g., Epic, Cerner, paper-based systems, data integration challenges...',
    industries: ['healthcare'],
  },
  {
    id: 'healthcare-q3',
    question: 'What clinical outcomes or quality metrics are you focused on improving?',
    category: 'business',
    placeholder: 'E.g., Readmission rates, patient satisfaction scores, length of stay, diagnostic turnaround time...',
    industries: ['healthcare'],
  },
  {
    id: 'financial-q1',
    question: 'What are your key challenges in risk management, fraud detection, or compliance?',
    category: 'challenges',
    placeholder: 'E.g., Transaction monitoring, AML compliance, fraud patterns, regulatory reporting...',
    industries: ['financial-services'],
  },
  {
    id: 'financial-q2',
    question: 'How do you currently handle customer onboarding and KYC processes?',
    category: 'business',
    placeholder: 'E.g., Manual document review, identity verification, credit checks, time to onboard...',
    industries: ['financial-services'],
  },
  {
    id: 'financial-q3',
    question: 'What customer experience improvements are you targeting?',
    category: 'users',
    placeholder: 'E.g., Personalized recommendations, faster loan approvals, digital banking features, chatbot support...',
    industries: ['financial-services'],
  },
  {
    id: 'manufacturing-q1',
    question: 'What are your main challenges in production efficiency or quality control?',
    category: 'challenges',
    placeholder: 'E.g., Equipment downtime, defect rates, production scheduling, quality inspection...',
    industries: ['manufacturing'],
  },
  {
    id: 'manufacturing-q2',
    question: 'How do you currently manage your supply chain and inventory?',
    category: 'business',
    placeholder: 'E.g., Manual tracking, ERP systems, stockouts, demand forecasting, supplier coordination...',
    industries: ['manufacturing'],
  },
  {
    id: 'manufacturing-q3',
    question: 'What operational data do you collect from your production floor?',
    category: 'technical',
    placeholder: 'E.g., IoT sensors, machine telemetry, quality metrics, maintenance logs, production counts...',
    industries: ['manufacturing'],
  },
  {
    id: 'retail-q1',
    question: 'What are your biggest challenges in customer engagement and retention?',
    category: 'challenges',
    placeholder: 'E.g., Personalization, loyalty programs, cart abandonment, customer insights...',
    industries: ['retail'],
  },
  {
    id: 'retail-q2',
    question: 'How do you manage inventory across channels and locations?',
    category: 'business',
    placeholder: 'E.g., POS systems, e-commerce platforms, warehouse management, stockouts, overstock...',
    industries: ['retail'],
  },
  {
    id: 'retail-q3',
    question: 'What customer data and shopping behavior insights do you currently capture?',
    category: 'technical',
    placeholder: 'E.g., Purchase history, browsing behavior, demographic data, feedback, returns data...',
    industries: ['retail'],
  },
  {
    id: 'government-q1',
    question: 'What are your primary challenges in delivering citizen services?',
    category: 'challenges',
    placeholder: 'E.g., Application processing times, service accessibility, case management, resource allocation...',
    industries: ['government'],
  },
  {
    id: 'government-q2',
    question: 'What public data or information systems do you manage?',
    category: 'technical',
    placeholder: 'E.g., Citizen records, permit systems, GIS data, public records, legacy databases...',
    industries: ['government'],
  },
  {
    id: 'government-q3',
    question: 'What transparency or accountability improvements are you targeting?',
    category: 'business',
    placeholder: 'E.g., Public reporting, performance dashboards, decision-making transparency, audit trails...',
    industries: ['government'],
  },
  {
    id: 'education-q1',
    question: 'What are your main challenges in student learning outcomes or engagement?',
    category: 'challenges',
    placeholder: 'E.g., Personalized learning, student retention, assessment methods, learning analytics...',
    industries: ['education'],
  },
  {
    id: 'education-q2',
    question: 'How do you currently manage student information and academic records?',
    category: 'technical',
    placeholder: 'E.g., Student information systems, LMS platforms, grading systems, attendance tracking...',
    industries: ['education'],
  },
  {
    id: 'education-q3',
    question: 'What administrative processes are most resource-intensive?',
    category: 'business',
    placeholder: 'E.g., Enrollment, course scheduling, financial aid, faculty workload, facility management...',
    industries: ['education'],
  },
  {
    id: 'energy-q1',
    question: 'What are your key challenges in asset management or predictive maintenance?',
    category: 'challenges',
    placeholder: 'E.g., Equipment failures, maintenance scheduling, asset lifecycle, infrastructure monitoring...',
    industries: ['energy'],
  },
  {
    id: 'energy-q2',
    question: 'How do you currently monitor and optimize energy distribution or generation?',
    category: 'technical',
    placeholder: 'E.g., SCADA systems, smart meters, grid management, load forecasting, renewable integration...',
    industries: ['energy'],
  },
  {
    id: 'energy-q3',
    question: 'What sustainability or efficiency targets are you working toward?',
    category: 'business',
    placeholder: 'E.g., Emissions reduction, renewable energy mix, energy efficiency, grid reliability...',
    industries: ['energy'],
  },
  {
    id: 'telecom-q1',
    question: 'What are your main challenges in network performance or customer experience?',
    category: 'challenges',
    placeholder: 'E.g., Network congestion, service outages, customer churn, quality of service...',
    industries: ['telecommunications'],
  },
  {
    id: 'telecom-q2',
    question: 'How do you currently handle customer support and issue resolution?',
    category: 'business',
    placeholder: 'E.g., Call center operations, ticketing systems, self-service portals, escalation processes...',
    industries: ['telecommunications'],
  },
  {
    id: 'telecom-q3',
    question: 'What network or customer data do you collect and analyze?',
    category: 'technical',
    placeholder: 'E.g., Network performance metrics, usage patterns, customer behavior, service quality indicators...',
    industries: ['telecommunications'],
  },
]

export const aiAssessmentQuestions: DiscoveryQuestion[] = [
  // ============================
  // APPLICATION ARCHITECTURE
  // ============================
  {
    id: 'ai-arch-q1',
    question: 'Are you planning to build a new AI app, or extend an existing app to add AI capability?',
    category: 'technical',
    placeholder: 'E.g., new greenfield app, extend an existing CRM/portal, add copilots/agents to an existing workflow...',
  },
  {
    id: 'ai-arch-q2',
    question: 'If extending an existing app, where is it hosted today (Azure/Microsoft, another cloud, on-prem/VMs)?',
    category: 'technical',
    placeholder: 'E.g., Azure App Service, AKS, AWS, GCP, on-prem IIS, VMware VMs...',
  },
  {
    id: 'ai-arch-q3',
    question: 'What other applications or systems will connect to this solution? Are they Microsoft services or 3rd party?',
    category: 'technical',
    placeholder: 'E.g., ERP/CRM, data lake/warehouse, ticketing, identity, line-of-business apps...',
  },
  {
    id: 'ai-arch-q4',
    question: 'Do target systems support APIs/webhooks or other integration methods? Any preferred protocols or standards?',
    category: 'technical',
    placeholder: 'E.g., REST, SOAP, GraphQL, event-driven via queues/topics, file drops, EDI...',
  },
  {
    id: 'ai-arch-q5',
    question: "Who are the users of the system, and what’s your vision for the user experience?",
    category: 'users',
    placeholder: 'E.g., internal employees, customers/partners, contact center agents; web app, Teams, Copilot Studio...',
  },
  {
    id: 'ai-arch-q6',
    question: 'How do these rank in importance for achieving outcomes: availability, latency, security, geo distribution, cost, accuracy, speed to market?',
    category: 'business',
    placeholder: 'E.g., security > accuracy > latency > cost; needs multi-region active/active...',
    inputType: 'ranking',
    rankingItems: ['availability', 'latency', 'security', 'geo distribution', 'cost', 'accuracy', 'speed to market'],
  },
  {
    id: 'ai-arch-q7',
    question: 'How consistent are the workflows you expect? Do you require a high degree of autonomy?',
    category: 'challenges',
    placeholder: 'E.g., human-in-the-loop approvals required, autonomous actions allowed with audit logs, workflows change weekly...',
  },

  // ============================
  // DATA CONSIDERATIONS
  // ============================
  {
    id: 'ai-data-q1',
    question: 'What are the sources and formats of the data to be used, and is there a governance framework for quality and access?',
    category: 'technical',
    placeholder: 'E.g., PDFs, HTML, images, audio, JSON/CSV, databases; data catalog/lineage; RBAC; quality checks...',
  },
  {
    id: 'ai-data-q2',
    question: 'How large is the data, how fast does it change, and how quickly must updates be reflected for accurate results?',
    category: 'technical',
    placeholder: 'E.g., 10TB total, 50GB/day change; updates need to reflect within 1 hour...',
  },
  {
    id: 'ai-data-q3',
    question: 'Will the solution involve any form of enterprise or non-public data (e.g., in an enterprise data lake)?',
    category: 'technical',
    placeholder: 'E.g., internal docs, customer records, proprietary IP, regulated datasets...',
  },
  {
    id: 'ai-data-q4',
    question: 'How will you address data privacy and security concerns with the AI system (including prompt/response caching and storage)?',
    category: 'challenges',
    placeholder: 'E.g., PII/PHI masking, encryption, private networking, retention policies, audit trails...',
  },

  // ============================
  // AI CONSIDERATIONS
  // ============================
  {
    id: 'ai-model-q1',
    question: 'Have you experimented with model APIs? Are you planning to use a specific model, and why (latency, accuracy, scale, cost)?',
    category: 'business',
    placeholder: 'E.g., evaluated multiple models; need low latency; strong reasoning; constrained cost...',
  },
  {
    id: 'ai-model-q2',
    question: 'What embedding model(s) will you use for vectorization? How often should the vector store be refreshed, and what access controls are required?',
    category: 'technical',
    placeholder: 'E.g., daily refresh; per-user RBAC; document-level ACLs; multi-tenant separation...',
  },
  {
    id: 'ai-model-q3',
    question: 'Are you considering building or training your own model? If so, how will you train and evaluate it (accuracy, robustness, fairness)?',
    category: 'technical',
    placeholder: 'E.g., fine-tuning vs RAG; labeled data; evaluation harness; bias testing; drift monitoring...',
  },
  {
    id: 'ai-model-q4',
    question: 'What are you using to keep up with changes in data (data drift), model (LLMOps), apps (DevOps), and outcomes (model evaluation)?',
    category: 'technical',
    placeholder: 'E.g., monitoring, A/B tests, offline evals, guardrails, human review loops, telemetry...',
  },
  {
    id: 'ai-model-q5',
    question: 'How will you ensure the AI system is fair and unbiased?',
    category: 'challenges',
    placeholder: 'E.g., bias testing, representative datasets, feedback loops, policy checks...',
  },
  {
    id: 'ai-model-q6',
    question: 'What measures will you take to ensure the AI system is transparent and explainable?',
    category: 'challenges',
    placeholder: 'E.g., model cards, citations, decision logs, rationale capture, auditability...',
  },

  // ============================
  // INFRA & SECURITY
  // ============================
  {
    id: 'ai-sec-q1',
    question: 'What is your strategy to scale the AI solution, and what outcomes are you trying to achieve at scale?',
    category: 'business',
    placeholder: 'E.g., 10k users, 1M requests/day, 99.9% uptime, global reach...',
  },
  {
    id: 'ai-sec-q2',
    question: 'How are you planning foundational infrastructure to support AI at scale? Do you have an AI landing zone or standardized environment?',
    category: 'technical',
    placeholder: 'E.g., standardized subscriptions/resource groups, policy baselines, IaC, environment separation...',
  },
  {
    id: 'ai-sec-q3',
    question: 'Have you reviewed network architecture for the AI solution (segmentation, firewalls, encryption, private endpoints)?',
    category: 'technical',
    placeholder: 'E.g., VNet integration, private links, egress controls, WAF, TLS everywhere...',
  },
  {
    id: 'ai-sec-q4',
    question: 'What is your security model for the AI solution (identity, secrets, app publishing, approval processes, usage tracking)?',
    category: 'challenges',
    placeholder: 'E.g., Entra ID SSO, managed identities, secret rotation, internal vs external publishing...',
  },
  {
    id: 'ai-sec-q5',
    question: 'How are you thinking about governance and controls for the AI solution (access, monitoring, compliance, incident response)?',
    category: 'challenges',
    placeholder: 'E.g., policies, logging, prompt/response retention, DLP, audit trails, security reviews...',
  },
  {
    id: 'ai-sec-q6',
    question: 'How are you thinking about cost management and ROI measurement for the AI investment?',
    category: 'business',
    placeholder: 'E.g., baseline metrics, KPIs, chargeback/showback, cost caps, monthly ROI review cadence...',
  },

  // ============================
  // INDUSTRY-SPECIFIC VARIATIONS
  // ============================
  {
    id: 'ai-healthcare-q1',
    question: 'What regulated data types are in scope (e.g., PHI), and what clinical safety/compliance requirements must the AI solution meet?',
    category: 'challenges',
    placeholder: 'E.g., HIPAA, clinical validation, auditability, model output review by clinicians...',
    industries: ['healthcare'],
  },
  {
    id: 'ai-financial-q1',
    question: 'What regulatory, auditability, and risk controls are required for AI outputs in your environment?',
    category: 'challenges',
    placeholder: 'E.g., AML/KYC, model risk management, explainability, audit trails, data retention...',
    industries: ['financial-services'],
  },
  {
    id: 'ai-manufacturing-q1',
    question: 'Will AI need to operate with OT/IoT/edge systems (e.g., SCADA, shop-floor equipment), and what latency or offline constraints exist?',
    category: 'technical',
    placeholder: 'E.g., edge inferencing, intermittent connectivity, safety constraints, real-time telemetry...',
    industries: ['manufacturing'],
  },
  {
    id: 'ai-retail-q1',
    question: 'What customer privacy constraints apply (PII/behavioral data), and how will personalization be governed and measured?',
    category: 'challenges',
    placeholder: 'E.g., consent, opt-out, data minimization, fairness in offers, uplift metrics...',
    industries: ['retail'],
  },
  {
    id: 'ai-government-q1',
    question: 'What public-sector security/compliance requirements apply (data residency, accreditation, accessibility, auditability)?',
    category: 'challenges',
    placeholder: 'E.g., data residency, accessibility standards, records management, procurement constraints...',
    industries: ['government'],
  },
  {
    id: 'ai-education-q1',
    question: 'What student/learner data protections apply, and what guardrails are needed for responsible AI use in learning workflows?',
    category: 'challenges',
    placeholder: 'E.g., FERPA-like requirements, academic integrity, explainability, human review...',
    industries: ['education'],
  },
  {
    id: 'ai-energy-q1',
    question: 'Will AI interact with critical infrastructure systems, and what resiliency/safety/compliance controls are required?',
    category: 'challenges',
    placeholder: 'E.g., SCADA/ICS security, NERC-like controls, segmentation, incident response...',
    industries: ['energy'],
  },
  {
    id: 'ai-telecom-q1',
    question: 'What scale/latency expectations exist for network telemetry and customer experience use cases, and what data pipelines are involved?',
    category: 'technical',
    placeholder: 'E.g., near real-time telemetry, millions of events/sec, streaming pipelines, SLOs...',
    industries: ['telecommunications'],
  },
]

// ============================================================================
// INFRASTRUCTURE & MIGRATION QUESTIONS (ATS / CSA track)
// ============================================================================

export const infrastructureQuestions: DiscoveryQuestion[] = [
  {
    id: 'infra-q1',
    question: 'What does your current datacenter and server estate look like? (on-premises, co-located, single cloud, multi-cloud)',
    category: 'technical',
    placeholder: 'E.g., 200 VMs in on-prem VMware vSphere, 50 VMs in AWS, some Azure App Services...',
  },
  {
    id: 'infra-q2',
    question: 'Which workloads or applications are you considering migrating to Azure, and what is driving the move?',
    category: 'business',
    placeholder: 'E.g., SQL Server 2014 end-of-support, datacenter lease expiring, cost reduction, DR improvement...',
  },
  {
    id: 'infra-q3',
    question: 'What database and data platform technologies are in your estate? (SQL Server, Oracle, SAP HANA, PostgreSQL, etc.)',
    category: 'technical',
    placeholder: 'E.g., SQL Server 2016/2019, Oracle 12c, SAP ERP 6.0, MongoDB, Postgres...',
  },
  {
    id: 'infra-q4',
    question: 'Do you have any upcoming end-of-support dates driving urgency? (Windows Server, SQL Server, SAP, etc.)',
    category: 'challenges',
    placeholder: 'E.g., SQL Server 2014 ESU expiring, Windows Server 2012 R2, SAP ECC EOS 2027...',
  },
  {
    id: 'infra-q5',
    question: 'What is your network connectivity between on-premises and cloud? (ExpressRoute, VPN, SD-WAN)',
    category: 'technical',
    placeholder: 'E.g., ExpressRoute 1Gbps, site-to-site VPN, SD-WAN overlay, no direct connectivity yet...',
  },
  {
    id: 'infra-q6',
    question: 'What disaster recovery and business continuity requirements exist for critical workloads?',
    category: 'challenges',
    placeholder: 'E.g., RPO < 1hr for tier-1 apps, DR site in secondary region, annual DR testing...',
  },
  {
    id: 'infra-q7',
    question: 'What Azure Landing Zone or governance foundation do you have in place? (management groups, policies, subscription design)',
    category: 'technical',
    placeholder: 'E.g., basic subscription structure, no formal LZ, partial ESLZ deployment, Azure Lighthouse...',
  },
  {
    id: 'infra-q8',
    question: 'What is your organization\'s Azure consumption today, and do you have a MACC (Microsoft AI Cloud Commitment)?',
    category: 'business',
    placeholder: 'E.g., ~$50K/month ACR, $2M MACC over 3 years, 18 months remaining, on-track...',
  },
]

// ============================================================================
// MODERN WORK & SECURITY QUESTIONS (ATS track)
// ============================================================================

export const modernWorkQuestions: DiscoveryQuestion[] = [
  {
    id: 'mw-q1',
    question: 'What is your current Microsoft 365 licensing and adoption maturity? (E3, E5, Copilot licenses)',
    category: 'business',
    placeholder: 'E.g., M365 E5 across 5000 users, Copilot pilot with 200 seats, low Teams adoption...',
  },
  {
    id: 'mw-q2',
    question: 'How are you managing identity and access? (Entra ID, on-prem AD, federation, conditional access)',
    category: 'technical',
    placeholder: 'E.g., Hybrid AD with Entra ID Connect, conditional access basic policies, no PIM yet...',
  },
  {
    id: 'mw-q3',
    question: 'What is your endpoint management strategy? (Intune, SCCM, third-party MDM)',
    category: 'technical',
    placeholder: 'E.g., co-managed SCCM + Intune, BYOD with third-party MDM, Windows 11 migration in progress...',
  },
  {
    id: 'mw-q4',
    question: 'What is your current security posture? (Defender suite, SIEM/XDR, zero-trust maturity)',
    category: 'challenges',
    placeholder: 'E.g., Defender for Endpoint P2, Sentinel deployed, starting zero-trust journey, no CNAPP...',
  },
  {
    id: 'mw-q5',
    question: 'Are you using or evaluating Microsoft 365 Copilot? What use cases are most interesting?',
    category: 'business',
    placeholder: 'E.g., evaluating for Sales team, interest in meeting summarization, document drafting, data analysis...',
  },
  {
    id: 'mw-q6',
    question: 'How do you handle data governance and information protection today? (Purview, DLP, sensitivity labels)',
    category: 'challenges',
    placeholder: 'E.g., basic DLP policies, no sensitivity labels yet, starting Purview rollout, GDPR concerns...',
  },
  {
    id: 'mw-q7',
    question: 'What collaboration challenges do your teams face? (remote work, cross-org collaboration, information silos)',
    category: 'users',
    placeholder: 'E.g., hybrid workforce struggles, SharePoint adoption low, too many tools, Teams governance gaps...',
  },
  {
    id: 'mw-q8',
    question: 'What compliance and regulatory requirements affect your modern workplace strategy?',
    category: 'challenges',
    placeholder: 'E.g., data residency, retention policies, eDiscovery, audit requirements, industry-specific mandates...',
  },
]

// ============================================================================
// FULL PORTFOLIO QUESTIONS (ATS meta-track — top questions across all domains)
// ============================================================================

export const fullPortfolioQuestions: DiscoveryQuestion[] = [
  // Business strategy (from use-case track)
  discoveryQuestions[0],  // q1: Primary business objectives
  discoveryQuestions[1],  // q2: Biggest pain points
  // Infrastructure & migration
  {
    id: 'fp-q3',
    question: 'What does your current IT estate look like — datacenter, cloud, hybrid? Any migration drivers? (end-of-support, lease, cost)',
    category: 'technical',
    placeholder: 'E.g., split across on-prem VMware and AWS, datacenter lease expiring in 18 months...',
  },
  {
    id: 'fp-q4',
    question: 'What database, ERP, and line-of-business platforms are critical? (SQL, SAP, Oracle, custom apps)',
    category: 'technical',
    placeholder: 'E.g., SAP ECC 6.0, SQL Server 2016, Oracle E-Business Suite, custom .NET apps...',
  },
  // Modern work & security
  {
    id: 'fp-q5',
    question: 'What is your Microsoft 365 and security posture today? (licensing, Copilot, Defender, identity)',
    category: 'technical',
    placeholder: 'E.g., M365 E5, Copilot pilot, Defender for Endpoint, Entra ID with conditional access...',
  },
  {
    id: 'fp-q6',
    question: 'What are the biggest collaboration, productivity, or security challenges your teams face?',
    category: 'challenges',
    placeholder: 'E.g., hybrid work adoption, data governance gaps, too many security tools, insider risk...',
  },
  // AI & Innovation
  {
    id: 'fp-q7',
    question: 'Where do you see AI or automation making the biggest impact? What experiments have you tried?',
    category: 'business',
    placeholder: 'E.g., customer service chatbots, document processing, predictive maintenance, code assistance...',
  },
  discoveryQuestions[5],  // q6: What data sources available
  // Consumption & commitment
  {
    id: 'fp-q9',
    question: 'What is your current Azure consumption, and do you have a MACC or enterprise agreement?',
    category: 'business',
    placeholder: 'E.g., $75K/month ACR, $3M MACC over 3 years, EA renewal in Q2 FY27...',
  },
  // Competitive landscape
  {
    id: 'fp-q10',
    question: 'Which other cloud or technology vendors are you using or evaluating? (AWS, GCP, Salesforce, etc.)',
    category: 'challenges',
    placeholder: 'E.g., primary AWS for compute, Salesforce CRM, evaluating Google Workspace vs M365...',
  },
  // Compliance & readiness
  discoveryQuestions[7],  // q8: Regulatory/compliance requirements
  // Success vision
  {
    id: 'fp-q12',
    question: 'What does success look like for your technology strategy in the next 12-18 months? What decisions are you making this quarter?',
    category: 'business',
    placeholder: 'E.g., complete datacenter exit, launch AI pilot, achieve 80% Teams adoption, reduce spend 20%...',
  },
]

function getQuestionsForTrack(track: DiscoveryTrack): DiscoveryQuestion[] {
  switch (track) {
    case 'ai-assessment': return aiAssessmentQuestions
    case 'infrastructure': return infrastructureQuestions
    case 'modern-work': return modernWorkQuestions
    case 'full-portfolio': return fullPortfolioQuestions
    default: return discoveryQuestions
  }
}

export function getQuestionsForIndustry(industry: Industry, track: DiscoveryTrack = 'use-case'): DiscoveryQuestion[] {
  const questions = getQuestionsForTrack(track)
  // Full portfolio and infrastructure tracks don't have industry-specific variations
  if (track === 'full-portfolio' || track === 'infrastructure' || track === 'modern-work') {
    return questions
  }
  const generalQuestions = questions.filter((q) => !q.industries)
  const industryQuestions = questions.filter((q) => q.industries && q.industries.includes(industry))
  return [...generalQuestions, ...industryQuestions]
}
