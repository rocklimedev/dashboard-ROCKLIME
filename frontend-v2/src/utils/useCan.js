import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const FULL_ACCESS = ['SUPER_ADMIN', 'DEVELOPER'];

/** Role names of the logged-in user (from the profile and the permissions call). */
export const useRoles = () => {
  const { auth } = useAuth();
  let roles = auth?.user?.roles || [];
  if (typeof roles === 'string') {
    try {
      roles = JSON.parse(roles);
    } catch {
      roles = [roles];
    }
  }
  return [...new Set([...(Array.isArray(roles) ? roles : []), auth?.role].filter(Boolean))];
};

/**
 * can(module, action) mirrors the server's permission check:
 * SUPER_ADMIN and DEVELOPER may do everything, others need the module/action pair.
 * Keep the server as the real guard — this only hides buttons people cannot use.
 */
export default function useCan() {
  const { auth } = useAuth();
  const roles = useRoles();
  const permissions = useMemo(() => auth?.permissions || [], [auth?.permissions]);
  const full = roles.some((r) => FULL_ACCESS.includes(r));
  return useCallback(
    (module, action = 'view') =>
      full ||
      permissions.some((p) => p.module === module && (p.action === action || p.api === action)),
    [full, permissions],
  );
}
