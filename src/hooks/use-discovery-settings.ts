import { useKV } from '@github/spark/hooks'

export interface DiscoverySettings {
  enableFollowUpQuestions: boolean
}

const defaultSettings: DiscoverySettings = {
  enableFollowUpQuestions: true,
}

export function useDiscoverySettings() {
  const [settings, setSettings] = useKV<DiscoverySettings>('discovery-settings', defaultSettings)

  const updateSettings = (updates: Partial<DiscoverySettings>) => {
    setSettings((current) => ({
      ...(current || defaultSettings),
      ...updates,
    }))
  }

  return {
    settings: settings || defaultSettings,
    updateSettings,
  }
}
