// PermissionGate.js
import { useAuth } from "./AuthContext";
export default function PermissionGate({
  api,
  module,
  children,
  fallback = null,
}) {
  const { permissions, loadingPermissions } = useAuth();

  if (loadingPermissions) return null; // or a spinner

  const allowed = permissions.some((p) => p.api === api && p.module === module);

  return allowed ? children : fallback;
}
