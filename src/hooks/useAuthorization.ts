import { useMemo } from 'react'
import { useAppSelector } from '../store/hooks'

export const useAuthorization = () => {
  const auth = useAppSelector((s) => s.auth)
  const user = auth.user

  const can = useMemo(() => {
    const permissions = user?.permissions ?? []
    return (required: string | string[] | undefined) => {
      if (!required) return true
      if (permissions.includes('*')) return true
      const requiredList = Array.isArray(required) ? required : [required]
      return requiredList.every((p) => permissions.includes(p))
    }
  }, [user?.permissions])

  const hasRole = useMemo(() => {
    const roles = user?.roles ?? []
    return (required: string | string[] | undefined) => {
      if (!required) return true
      const requiredList = Array.isArray(required) ? required : [required]
      return requiredList.some((r) => roles.includes(r))
    }
  }, [user?.roles])

  return { can, hasRole, user }
}

export default useAuthorization 