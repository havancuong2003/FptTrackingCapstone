import { useMemo, useState, type PropsWithChildren, useEffect } from 'react'
import type { AppConfig } from './appConfigTypes'
import { defaultAppConfig } from './appConfigTypes'
import { setRuntimeConfig } from './appRuntime'
import { AppConfigContext } from './appConfigContext'

export const AppConfigProvider = ({ children, initial }: PropsWithChildren<{ initial?: Partial<AppConfig> }>) => {
  const [config, setConfig] = useState<AppConfig>({
    ...defaultAppConfig,
    ...initial,
    message: {
      ...defaultAppConfig.message,
      ...(initial?.message || {}),
      codeMap: { ...defaultAppConfig.message.codeMap, ...(initial?.message?.codeMap || {}) },
    },
    menus: initial?.menus || defaultAppConfig.menus,
  })

  // đồng bộ cấu hình runtime cho nơi không dùng React
  useEffect(() => { setRuntimeConfig(config) }, [config])

  const updateConfig = (partial: Partial<AppConfig>) => {
    setConfig((prev) => {
      const next: AppConfig = {
        ...prev,
        ...partial,
        message: {
          ...prev.message,
          ...(partial.message || {}),
          codeMap: { ...prev.message.codeMap, ...(partial.message?.codeMap || {}) },
        },
        menus: partial.menus || prev.menus,
      }
      setRuntimeConfig(next)
      return next
    })
  }

  const value = useMemo(() => ({ config, updateConfig }), [config])

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>
} 