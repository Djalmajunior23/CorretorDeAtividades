import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface RoleBasedRouteProps {
  allowedRoles: ('ADMIN' | 'PROFESSOR' | 'ALUNO')[];
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role as any)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
};
