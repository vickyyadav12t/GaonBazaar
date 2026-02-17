import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useRedux';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

/**
 * Protected Route Component (Frontend Route Guard)
 * 
 * Protects routes that require authentication
 * Optionally restricts access to specific user roles
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoles,
  redirectTo = '/login'
}: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    // Save the attempted location for redirect after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if user role is allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role
    switch (user.role) {
      case 'farmer':
        return <Navigate to="/farmer/dashboard" replace />;
      case 'buyer':
        return <Navigate to="/buyer/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;







