import { useAuth } from "../context/AuthContext";

const PermissionsGate = ({ required, children, fallback = null }) => {
  const { auth } = useAuth();
  const userPermissions = auth?.permissions || [];

  if (!required) return children;
  if (!userPermissions.length) return null;

  const hasPermission = required.some((perm) => userPermissions.includes(perm));

  return hasPermission ? children : fallback;
};

export default PermissionsGate;
