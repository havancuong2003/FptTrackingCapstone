import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import useAuthorization from '../hooks/useAuthorization'

interface RequireAuthProps {
  requiredPermissions?: string[]
}

const RequireAuth = ({ children, requiredPermissions }: PropsWithChildren<RequireAuthProps>) => {
  const location = useLocation()
  const { isAuthenticated } = useAppSelector((s) => s.auth)
  const { can } = useAuthorization()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requiredPermissions && !can(requiredPermissions)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default RequireAuth 