/**
 * Azure-icon registry — maps `ServiceDef.id` to a renderable icon descriptor.
 *
 * Two strategies coexist:
 *   1. Bundled SVG: drop the official Microsoft Azure Architecture Icon
 *      under `src/assets/azure-icons/{file}.svg`. The map below references
 *      it via `import('...').default` so Vite hashes/optimizes it.
 *   2. Inline glyph fallback: when an SVG is not yet bundled, we render a
 *      vendor-coloured tile with a 1–3 letter glyph. This lets the diagrams
 *      ship today; SVGs can be dropped in incrementally without any code
 *      changes elsewhere.
 *
 * The `AzureIcon` component handles both cases.
 */

import type { ServiceVendor } from '@/lib/solution-blueprint/types'

export type IconDescriptor = {
  /** Stable id (matches ServiceDef.id when known). */
  id: string
  /** Human label, used as alt text + tooltip. */
  label: string
  /** Path to a bundled SVG (Vite-resolved). Undefined → use glyph fallback. */
  svgUrl?: string
  /** 1–3 char glyph rendered when svgUrl is not provided. */
  glyph: string
  /** Vendor — drives tile colour. */
  vendor: ServiceVendor
  /** Coarse category, used for grouping/legend. */
  category: 'ai' | 'data' | 'compute' | 'integration' | 'identity' | 'security' | 'ops' | 'ux' | 'other'
}

/** Vendor tile colours (tailwind hex equivalents tuned for shadcn light/dark). */
export const VENDOR_COLORS: Record<ServiceVendor, { bg: string; fg: string; ring: string }> = {
  azure:          { bg: '#0078D4', fg: '#FFFFFF', ring: '#0F4880' },
  'microsoft-365':{ bg: '#7B83EB', fg: '#FFFFFF', ring: '#4A52C0' },
  aws:            { bg: '#FF9900', fg: '#1A1A1A', ring: '#B36B00' },
  gcp:            { bg: '#4285F4', fg: '#FFFFFF', ring: '#1A56C0' },
  oracle:         { bg: '#C74634', fg: '#FFFFFF', ring: '#7E2D20' },
  sap:            { bg: '#0FAAFF', fg: '#1A1A1A', ring: '#0773AB' },
  salesforce:     { bg: '#00A1E0', fg: '#FFFFFF', ring: '#006A95' },
  snowflake:      { bg: '#29B5E8', fg: '#1A1A1A', ring: '#1A7AA0' },
  databricks:     { bg: '#FF3621', fg: '#FFFFFF', ring: '#A82515' },
  servicenow:     { bg: '#62D84E', fg: '#1A1A1A', ring: '#3F8C32' },
  'on-prem':      { bg: '#6B7280', fg: '#FFFFFF', ring: '#374151' },
  other:          { bg: '#94A3B8', fg: '#0F172A', ring: '#475569' },
}

/**
 * Curated map covering every entry in `service-catalog.ts`.
 * Add `svgUrl` once an SVG is bundled (e.g. `svgUrl: azureFoundrySvg`).
 */
export const ICON_REGISTRY: Record<string, IconDescriptor> = {
  // App & AI
  'azure-foundry':         { id: 'azure-foundry',         label: 'Foundry',          glyph: 'AF',  vendor: 'azure',          category: 'ai' },
  'azure-openai':          { id: 'azure-openai',          label: 'Azure OpenAI',     glyph: 'AOAI',vendor: 'azure',          category: 'ai' },
  'azure-content-safety':  { id: 'azure-content-safety',  label: 'Content Safety',   glyph: 'CS',  vendor: 'azure',          category: 'ai' },
  'azure-apim-ai-gateway': { id: 'azure-apim-ai-gateway', label: 'APIM AI Gateway',  glyph: 'GW',  vendor: 'azure',          category: 'integration' },
  'azure-doc-intel':       { id: 'azure-doc-intel',       label: 'Doc Intelligence', glyph: 'DI',  vendor: 'azure',          category: 'ai' },
  'azure-speech':          { id: 'azure-speech',          label: 'AI Speech',        glyph: 'SP',  vendor: 'azure',          category: 'ai' },
  'azure-app-service':     { id: 'azure-app-service',     label: 'App Service',      glyph: 'AS',  vendor: 'azure',          category: 'compute' },
  'azure-container-apps':  { id: 'azure-container-apps',  label: 'Container Apps',   glyph: 'ACA', vendor: 'azure',          category: 'compute' },
  'azure-functions':       { id: 'azure-functions',       label: 'Functions',        glyph: 'FN',  vendor: 'azure',          category: 'compute' },
  'azure-logic-apps':      { id: 'azure-logic-apps',      label: 'Logic Apps',       glyph: 'LA',  vendor: 'azure',          category: 'integration' },
  'azure-event-hubs':      { id: 'azure-event-hubs',      label: 'Event Hubs',       glyph: 'EH',  vendor: 'azure',          category: 'integration' },
  'azure-service-bus':     { id: 'azure-service-bus',     label: 'Service Bus',      glyph: 'SB',  vendor: 'azure',          category: 'integration' },

  // M365 surfaces
  'm365-teams':            { id: 'm365-teams',            label: 'Teams',            glyph: 'T',   vendor: 'microsoft-365',  category: 'ux' },
  'm365-copilot':          { id: 'm365-copilot',          label: 'M365 Copilot',     glyph: 'CP',  vendor: 'microsoft-365',  category: 'ux' },
  'power-platform':        { id: 'power-platform',        label: 'Power Platform',   glyph: 'PP',  vendor: 'microsoft-365',  category: 'ux' },

  // Data
  'azure-sql':             { id: 'azure-sql',             label: 'Azure SQL',        glyph: 'SQL', vendor: 'azure',          category: 'data' },
  'azure-cosmos':          { id: 'azure-cosmos',          label: 'Cosmos DB',        glyph: 'CDB', vendor: 'azure',          category: 'data' },
  'azure-ai-search':       { id: 'azure-ai-search',       label: 'AI Search',        glyph: 'AIS', vendor: 'azure',          category: 'data' },
  'azure-fabric':          { id: 'azure-fabric',          label: 'Fabric',           glyph: 'FAB', vendor: 'azure',          category: 'data' },
  'azure-data-factory':    { id: 'azure-data-factory',    label: 'Data Factory',     glyph: 'ADF', vendor: 'azure',          category: 'data' },
  'azure-purview':         { id: 'azure-purview',         label: 'Purview',          glyph: 'PV',  vendor: 'azure',          category: 'data' },
  'azure-storage':         { id: 'azure-storage',         label: 'Storage / ADLS',   glyph: 'STG', vendor: 'azure',          category: 'data' },

  // Infra
  'azure-vnet':            { id: 'azure-vnet',            label: 'VNet + PE',        glyph: 'VN',  vendor: 'azure',          category: 'compute' },
  'azure-front-door':      { id: 'azure-front-door',      label: 'Front Door',       glyph: 'FD',  vendor: 'azure',          category: 'compute' },
  'azure-aks':             { id: 'azure-aks',             label: 'AKS',              glyph: 'AKS', vendor: 'azure',          category: 'compute' },
  'github-actions':        { id: 'github-actions',        label: 'GitHub Actions',   glyph: 'GH',  vendor: 'azure',          category: 'ops' },
  'azure-monitor':         { id: 'azure-monitor',         label: 'Monitor + AI',     glyph: 'MON', vendor: 'azure',          category: 'ops' },

  // Identity
  'entra-id':              { id: 'entra-id',              label: 'Entra ID',         glyph: 'EID', vendor: 'azure',          category: 'identity' },
  'entra-external-id':     { id: 'entra-external-id',     label: 'Entra External',   glyph: 'EXT', vendor: 'azure',          category: 'identity' },
  'entra-agent-id':        { id: 'entra-agent-id',        label: 'Entra Agent ID',   glyph: 'AGT', vendor: 'azure',          category: 'identity' },
  'entra-pim':             { id: 'entra-pim',             label: 'Entra PIM',        glyph: 'PIM', vendor: 'azure',          category: 'identity' },

  // Security
  'azure-key-vault':       { id: 'azure-key-vault',       label: 'Key Vault',        glyph: 'KV',  vendor: 'azure',          category: 'security' },
  'azure-ddos':            { id: 'azure-ddos',            label: 'DDoS',             glyph: 'DDoS',vendor: 'azure',          category: 'security' },
  'defender-cloud':        { id: 'defender-cloud',        label: 'Defender',         glyph: 'DEF', vendor: 'azure',          category: 'security' },
  'sentinel':              { id: 'sentinel',              label: 'Sentinel',         glyph: 'SEN', vendor: 'azure',          category: 'security' },

  // Operations
  'azure-cost-mgmt':       { id: 'azure-cost-mgmt',       label: 'Cost Mgmt',        glyph: 'CM',  vendor: 'azure',          category: 'ops' },
  'azure-quota':           { id: 'azure-quota',           label: 'Quota / CRG',      glyph: 'QC',  vendor: 'azure',          category: 'ops' },
  'azure-backup':          { id: 'azure-backup',          label: 'Backup + ASR',     glyph: 'BUP', vendor: 'azure',          category: 'ops' },

  // 3rd party
  'snowflake':             { id: 'snowflake',             label: 'Snowflake',        glyph: 'SF',  vendor: 'snowflake',      category: 'data' },
  'databricks':            { id: 'databricks',            label: 'Databricks',       glyph: 'DB',  vendor: 'databricks',     category: 'data' },
  'salesforce':            { id: 'salesforce',            label: 'Salesforce',       glyph: 'SFC', vendor: 'salesforce',     category: 'integration' },
  'sap':                   { id: 'sap',                   label: 'SAP',              glyph: 'SAP', vendor: 'sap',            category: 'integration' },
  'servicenow':            { id: 'servicenow',            label: 'ServiceNow',       glyph: 'SNW', vendor: 'servicenow',     category: 'integration' },
  'okta':                  { id: 'okta',                  label: 'Okta',             glyph: 'OKT', vendor: 'other',          category: 'identity' },
  'aws-s3':                { id: 'aws-s3',                label: 'AWS S3',           glyph: 'S3',  vendor: 'aws',            category: 'data' },
  'aws-rds':               { id: 'aws-rds',               label: 'AWS RDS',          glyph: 'RDS', vendor: 'aws',            category: 'data' },
}

/** Resolve an icon, with a deterministic fallback for unknown ids. */
export function getIcon(serviceId: string | undefined, fallback?: Partial<IconDescriptor>): IconDescriptor {
  const base =
    serviceId && ICON_REGISTRY[serviceId]
      ? ICON_REGISTRY[serviceId]
      : {
          id: serviceId ?? 'unknown',
          label: fallback?.label ?? serviceId ?? 'Service',
          glyph: fallback?.glyph ?? (fallback?.label ?? serviceId ?? '?').slice(0, 2).toUpperCase(),
          vendor: fallback?.vendor ?? 'other',
          category: fallback?.category ?? 'other',
        }
  // Eagerly auto-discover SVGs dropped into `src/assets/azure-icons/`.
  // The file basename is matched to the service id, e.g.
  // `src/assets/azure-icons/azure-foundry.svg` → ICON_REGISTRY['azure-foundry'].svgUrl.
  // This means real Microsoft Azure Architecture Icons can be added without
  // any code edits — drop the file and rebuild.
  const url = serviceId ? AUTO_SVG_URLS[serviceId] : undefined
  return url && !base.svgUrl ? { ...base, svgUrl: url } : base
}

// Vite glob: eagerly resolves to URL strings. Files are bundled and hashed.
// Returns an empty object during SSR / non-Vite test runners.
const AUTO_SVG_MODULES = (typeof import.meta !== 'undefined' && (import.meta as any).glob)
  ? (import.meta as any).glob('/src/assets/azure-icons/*.svg', { eager: true, import: 'default', query: '?url' })
  : ({} as Record<string, string>)

const AUTO_SVG_URLS: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  for (const [path, url] of Object.entries(AUTO_SVG_MODULES) as [string, string][]) {
    const match = path.match(/\/([^/]+)\.svg$/)
    if (match) out[match[1]] = url
  }
  return out
})()

