import type { PropsWithChildren } from 'react'
import useAuthorization from '../../hooks/useAuthorization'

interface RoleGuardProps {
  roles?: string[]
}

const RoleGuard = ({ roles, children }: PropsWithChildren<RoleGuardProps>) => {
  const { hasRole } = useAuthorization()
  if (roles && !hasRole(roles)) return null
  return <>{children}</>
}

export default RoleGuard 