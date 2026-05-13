/**
 * Estate templates
 * ----------------------------------------------------------------------------
 * Pre-baked TechnologyEstate snapshots architects can apply with one click
 * instead of clicking through 30+ controls. Each template captures a common
 * starting posture; the user can still toggle individual fields after.
 */

import type { TechnologyEstate } from './types'

export interface EstateTemplate {
  id: string
  label: string
  description: string
  patch: Partial<Omit<TechnologyEstate, 'id' | 'customerId' | 'customerName' | 'updatedAt'>>
}

export const ESTATE_TEMPLATES: EstateTemplate[] = [
  {
    id: 'standard-microsoft-stack',
    label: 'Standard Microsoft stack',
    description:
      'Azure-first customer with Entra ID, GitHub Actions, Bicep, and the common security baseline (Defender, Sentinel, Key Vault, Purview).',
    patch: {
      primaryCloud: 'azure',
      hasAzure: true,
      hasAws: false,
      hasGcp: false,
      hasOnPrem: false,
      identityProvider: 'entra-id',
      hasManagedIdentity: true,
      hasDefenderForCloud: true,
      hasSentinel: true,
      hasPurview: true,
      hasKeyVault: true,
      hasPrivateEndpoints: true,
      cicdPlatform: 'github-actions',
      iacPlatform: 'bicep',
      ownedServiceIds: [
        'entra-id', 'azure-key-vault', 'defender-cloud', 'sentinel', 'azure-purview',
        'azure-monitor', 'azure-storage', 'azure-vnet', 'github-actions',
        'azure-app-service', 'azure-sql', 'm365-teams',
      ],
    },
  },
  {
    id: 'azure-aws-hybrid',
    label: 'Azure + AWS hybrid',
    description:
      'Multi-cloud customer running production workloads in both Azure and AWS, mixed identity, Terraform-driven IaC.',
    patch: {
      primaryCloud: 'multi',
      hasAzure: true,
      hasAws: true,
      hasGcp: false,
      hasOnPrem: false,
      identityProvider: 'mixed',
      hasManagedIdentity: true,
      hasDefenderForCloud: true,
      hasSentinel: false,
      hasPurview: false,
      hasKeyVault: true,
      hasPrivateEndpoints: true,
      cicdPlatform: 'github-actions',
      iacPlatform: 'terraform',
      ownedServiceIds: [
        'entra-id', 'okta', 'azure-key-vault', 'defender-cloud', 'azure-monitor',
        'azure-storage', 'azure-vnet', 'github-actions',
        'aws-s3', 'aws-rds',
      ],
    },
  },
  {
    id: 'sovereign-regulated',
    label: 'Sovereign / regulated',
    description:
      'EU sovereign or government-grade customer: sovereignty required, sensitivity high, strict private networking, full security baseline.',
    patch: {
      primaryCloud: 'azure',
      hasAzure: true,
      sovereigntyRequired: true,
      sovereignProfile: 'EU Sovereign',
      identityProvider: 'entra-id',
      hasManagedIdentity: true,
      hasDefenderForCloud: true,
      hasSentinel: true,
      hasPurview: true,
      hasKeyVault: true,
      hasPrivateEndpoints: true,
      cicdPlatform: 'azure-devops',
      iacPlatform: 'bicep',
      ownedServiceIds: [
        'entra-id', 'entra-pim', 'azure-key-vault', 'defender-cloud', 'sentinel',
        'azure-purview', 'azure-monitor', 'azure-storage', 'azure-vnet',
        'azure-front-door', 'azure-ddos', 'azure-backup',
      ],
    },
  },
  {
    id: 'data-modernization',
    label: 'Data + analytics modernisation',
    description:
      'Customer focused on Fabric, Databricks/Snowflake migration, Purview governance and a Lakehouse pattern.',
    patch: {
      primaryCloud: 'azure',
      hasAzure: true,
      identityProvider: 'entra-id',
      hasManagedIdentity: true,
      hasKeyVault: true,
      hasPurview: true,
      cicdPlatform: 'github-actions',
      iacPlatform: 'terraform',
      ownedServiceIds: [
        'entra-id', 'azure-key-vault', 'azure-monitor', 'azure-storage', 'azure-vnet',
        'azure-fabric', 'azure-data-factory', 'azure-purview', 'databricks', 'snowflake',
      ],
    },
  },
  {
    id: 'greenfield-startup',
    label: 'Greenfield / startup',
    description:
      'No prior Microsoft footprint. Bare Azure subscription, GitHub Actions, Bicep — recommend the foundations as well as the use case.',
    patch: {
      primaryCloud: 'azure',
      hasAzure: true,
      identityProvider: 'entra-id',
      hasManagedIdentity: false,
      hasDefenderForCloud: false,
      hasSentinel: false,
      hasPurview: false,
      hasKeyVault: false,
      hasPrivateEndpoints: false,
      cicdPlatform: 'github-actions',
      iacPlatform: 'bicep',
      ownedServiceIds: [],
    },
  },
]

export function applyEstateTemplate(
  base: Omit<TechnologyEstate, 'id' | 'customerId' | 'customerName' | 'updatedAt'>,
  templateId: string,
): Partial<TechnologyEstate> {
  const t = ESTATE_TEMPLATES.find((x) => x.id === templateId)
  if (!t) return {}
  // Merge owned service ids (union), everything else: template wins.
  const owned = Array.from(new Set([...(base.ownedServiceIds || []), ...(t.patch.ownedServiceIds || [])]))
  return { ...t.patch, ownedServiceIds: owned }
}
