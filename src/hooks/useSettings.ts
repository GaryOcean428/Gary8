import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  apiKey: string
  modelName: string
  temperature: number
  maxTokens: number
  setApiKey: (key: string) => void
  setModelName: (name: string) => void
  setTemperature: (temp: number) => void
  setMaxTokens: (tokens: number) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
      setApiKey: (key) => set({ apiKey: key }),
      setModelName: (name) => set({ modelName: name }),
      setTemperature: (temp) => set({ temperature: temp }),
      setMaxTokens: (tokens) => set({ maxTokens: tokens }),
    }),
    {
      name: 'settings-storage',
    }
  )
) 