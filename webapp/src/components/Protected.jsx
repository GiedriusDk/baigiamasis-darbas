import { Navigate, useLocation } from 'react-router-dom'
import * as auth from '../api/auth'

export default function Protected({ children }) {
  const location = useLocation()
  const token = auth.getToken()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}