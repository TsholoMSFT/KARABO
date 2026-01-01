import { useLocalStorage } from './use-local-storage'

export interface DiscoverySettings {
  enableFollowUpQuestions: boolean
}

const defaultSettings: DiscoverySettings = {
  enableFollowUpQuestions: true,
}

export function useDiscoverySettings() {
  const [settings, setSettings] = useLocalStorage<DiscoverySettings>('discovery-settings', defaultSettings)

  const updateSettings = (updates: Partial<DiscoverySettings>) => {
    setSettings({
      ...(settings || defaultSettings),
      ...updates,
    })
  }

  return {
    settings: settings || defaultSettings,
    updateSettings,
  }
}
