import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ requiredPermission }) => {
  const { auth, authChecked, isLoadingPermissions } = useAuth();

  if (!authChecked) return null;
  if (!auth?.token) return <Navigate to="/login" replace />;

  if (isLoadingPermissions && !auth?.permissions) return null;

  // If no permission required, allow by default
  if (!requiredPermission) return <Outlet />;

  const { api, module } = requiredPermission;

  const hasPermission = auth?.permissions?.some(
    (perm) => perm.api === api && perm.module === module
  );

  if (!hasPermission) return <Navigate to="/403" replace />;

  return <Outlet />;
};

export default PrivateRoute;
