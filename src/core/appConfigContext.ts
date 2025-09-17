import { createContext } from 'react'
import type { AppConfig } from './appConfigTypes'

export interface AppConfigContextValue {
  config: AppConfig
  updateConfig: (partial: Partial<AppConfig>) => void
}

export const AppConfigContext = createContext<AppConfigContextValue | undefined>(undefined) 