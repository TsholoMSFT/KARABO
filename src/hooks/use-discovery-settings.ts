import { useLocalStorage } from './use-local-storage'

export interface DiscoverySettings {
  // Master AI toggle
  enableAIAssist: boolean
  
  // Quick Discovery AI features
  enableFollowUpQuestions: boolean
  enableAIInsights: boolean
  
  // Enterprise Discovery AI features
  enableSCQGeneration: boolean
  enableUseCaseGeneration: boolean
  
  // NEW: MVP 5-Stage AI features
  enableStakeholderSuggestions: boolean // AI-assisted stakeholder mapping
  enableAutoRICEScoring: boolean // Automatic RICE from COI data
  enableExecutiveSummary: boolean // AI-generated executive summary
}

const defaultSettings: DiscoverySettings = {
  enableAIAssist: true,
  enableFollowUpQuestions: true,
  enableAIInsights: true,
  enableSCQGeneration: true,
  enableUseCaseGeneration: true,
  enableStakeholderSuggestions: true,
  enableAutoRICEScoring: true,
  enableExecutiveSummary: true,
}

export function useDiscoverySettings() {
  const [settings, setSettings] = useLocalStorage<DiscoverySettings>('discovery-settings', defaultSettings)

  const updateSettings = (updates: Partial<DiscoverySettings>) => {
    setSettings({
      ...(settings || defaultSettings),
      ...updates,
    })
  }

  // Helper to check if a specific AI feature is enabled (respects master toggle)
  const isAIFeatureEnabled = (feature: keyof Omit<DiscoverySettings, 'enableAIAssist'>): boolean => {
    const currentSettings = settings || defaultSettings
    return currentSettings.enableAIAssist && currentSettings[feature]
  }

  return {
    settings: settings || defaultSettings,
    updateSettings,
    isAIFeatureEnabled,
  }
}
