
import React from 'react';
import { Permission, UserRole, ROLE_PERMISSIONS } from '../types';

interface RoleGuardProps {
  userRole: UserRole;
  permission?: Permission;
  requiredRole?: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RoleGuard component to wrap UI elements that require specific permissions.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  userRole, 
  permission, 
  requiredRole, 
  children, 
  fallback = null 
}) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  
  const hasPermission = permission ? permissions.includes(permission) : true;
  const hasRole = requiredRole ? requiredRole.includes(userRole) : true;

  if (hasPermission && hasRole) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * Hook to check permissions programmatically
 */
export const usePermissions = (userRole: UserRole) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  
  const can = (permission: Permission) => permissions.includes(permission);
  const is = (role: UserRole) => userRole === role;
  
  return { can, is };
};
