import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useRedux';
import ProtectedRoute from './ProtectedRoute';

/**
 * Admin-only Route Component
 * 
 * Protects admin routes and ensures only admin users can access
 */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAppSelector((state) => state.auth);

  // Double-check admin role
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      {children}
    </ProtectedRoute>
  );
};

export default AdminRoute;







