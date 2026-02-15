
import { User, UserRole } from '../types';

export const ROLES = {
  ADMIN: 'admin',     // App Founder/Super Admin
  MANAGER: 'manager', // Team Lead
  ANALYST: 'analyst', // QA Specialist
  AGENT: 'agent'      // Customer Support Rep
} as const;

export type Permission = 
  | 'view_all_history'    // See history of entire company
  | 'manage_team'         // Promote/Demote agents, remove users
  | 'manage_billing'      // Access usage/billing
  | 'configure_qa'        // Edit scorecards/criteria
  | 'view_admin_console'  // App Founder Console
  | 'delete_evaluation';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [ROLES.ADMIN]: [
    'view_all_history',
    'manage_team',
    'manage_billing',
    'configure_qa',
    'view_admin_console',
    'delete_evaluation'
  ],
  [ROLES.MANAGER]: [
    'view_all_history',
    'manage_team',
    'manage_billing',
    'configure_qa',
    'delete_evaluation'
  ],
  [ROLES.ANALYST]: [
    'view_all_history',
    'configure_qa'
  ],
  [ROLES.AGENT]: [
    // Agents have no special permissions, they can only see their own data (enforced by RLS)
  ]
};

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user || !user.role) return false;
  const userPerms = ROLE_PERMISSIONS[user.role] || [];
  return userPerms.includes(permission);
};

export const canManageRole = (currentUser: User, targetRole: UserRole): boolean => {
  if (!currentUser.role) return false;
  
  // Founders can manage anyone
  if (currentUser.role === ROLES.ADMIN) return true;

  // Managers can manage Analysts and Agents
  if (currentUser.role === ROLES.MANAGER) {
    return targetRole === ROLES.AGENT || targetRole === ROLES.ANALYST;
  }

  return false;
};
