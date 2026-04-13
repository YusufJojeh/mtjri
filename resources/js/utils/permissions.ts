type AuthData = {
  user?: {
    type?: string;
    [key: string]: unknown;
  };
  permissions?: string[];
  roles?: string[];
};
type Action = {
  requiredPermission?: string;
} & Record<string, unknown>;

/**
 * Check if the current user has a specific permission
 */
export function hasPermission(auth: AuthData, permission: string): boolean {
  if (auth?.user?.type === 'superadmin' || auth?.user?.type === 'super admin') {
    return true;
  }
  const permissions = auth?.permissions || [];
  return permissions.includes(permission);
}

/**
 * Check if the current user has any of the specified permissions
 */
export function hasAnyPermission(auth: AuthData, permissionList: string[]): boolean {
  if (auth?.user?.type === 'superadmin' || auth?.user?.type === 'super admin') {
    return true;
  }
  const permissions = auth?.permissions || [];
  return permissionList.some(permission => permissions.includes(permission));
}

/**
 * Check if the current user has all of the specified permissions
 */
export function hasAllPermissions(auth: AuthData, permissionList: string[]): boolean {
  if (auth?.user?.type === 'superadmin' || auth?.user?.type === 'super admin') {
    return true;
  }
  const permissions = auth?.permissions || [];
  return permissionList.every(permission => permissions.includes(permission));
}

/**
 * Check if the current user has a specific role
 */
export function hasRole(auth: AuthData, role: string): boolean {
  const roles = auth?.roles || [];
  return roles.includes(role);
}

/**
 * Check if the current user has any of the specified roles
 */
export function hasAnyRole(auth: AuthData, roleList: string[]): boolean {
  const roles = auth?.roles || [];
  return roleList.some(role => roles.includes(role));
}

/**
 * Get all permissions for the current user
 */
export function getUserPermissions(auth: AuthData): string[] {
  return auth?.permissions || [];
}

/**
 * Get all roles for the current user
 */
export function getUserRoles(auth: AuthData): string[] {
  return auth?.roles || [];
}

/**
 * Check if user can perform CRUD operations on an entity
 */
export function canPerformCrudOperation(auth: AuthData, entity: string, operation: 'view' | 'create' | 'edit' | 'delete'): boolean {
  const permissionName = `${operation}-${entity}`;
  return hasPermission(auth, permissionName);
}

/**
 * Filter actions based on user permissions
 */
export function filterActionsByPermissions(auth: AuthData, actions: Action[]): Action[] {
  return actions.filter(action => {
    if (!action.requiredPermission) {
      return true;
    }
    
    return hasPermission(auth, action.requiredPermission);
  });
}

/**
 * Check if user can access a specific module
 */
export function canAccessModule(auth: AuthData, module: string): boolean {
  return hasPermission(auth, `manage-${module}`) || hasPermission(auth, `view-${module}`);
}
