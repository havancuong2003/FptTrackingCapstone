import { useContext } from 'react'
import { AppConfigContext } from './appConfigContext'

export const useAppConfig = () => {
  const ctx = useContext(AppConfigContext)
  if (!ctx) throw new Error('useAppConfig must be used within AppConfigProvider')
  return ctx
}
