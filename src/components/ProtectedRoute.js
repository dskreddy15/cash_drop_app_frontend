import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Redirects to /login if there is no access token (e.g. session expired or not logged in).
 * Use for all routes that require authentication.
 */
function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = sessionStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default ProtectedRoute;
