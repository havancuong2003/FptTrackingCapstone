import type { AppConfig } from './appConfigTypes'

let runtimeConfig: AppConfig | null = null

export const setRuntimeConfig = (cfg: AppConfig) => {
  runtimeConfig = cfg
}

export const getRuntimeConfig = (): AppConfig => {
  if (!runtimeConfig) throw new Error('Runtime config has not been initialized')
  return runtimeConfig
} 