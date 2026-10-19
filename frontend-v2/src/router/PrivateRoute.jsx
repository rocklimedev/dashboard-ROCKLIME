import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spin } from "antd";
import useCan, { useRoles } from "../utils/useCan";
import { ADMIN_ROLES } from "../apps/registry";
import AccessDenied from "../concepts/Error/AccessDenied";

const PrivateRoute = ({ requiredPermission, requiredAppPermission, children }) => {
  const { auth, authChecked, isLoadingPermissions } = useAuth();
  const can = useCan();
  const roles = useRoles();

  if (!authChecked) return <Spin size="large" />;
  if (!auth?.token) return <Navigate to="/login" replace />;

  if (isLoadingPermissions && !auth?.permissions) return <div className="page-wrapper"><div className="content"><Spin size="large" /></div></div>;

  // Every inside route needs app view access, even if its page action is granted.
  if (requiredAppPermission && !can(requiredAppPermission.module, "view")) {
    return <AccessDenied permission={requiredAppPermission} />;
  }

  // If no permission required, allow by default
  if (!requiredPermission) return children || <Outlet />;

  const { api, action, module, adminOnly } = requiredPermission;

  const hasPermission = adminOnly
    ? roles.some((role) => ADMIN_ROLES.includes(role))
    : can(module, action || api || "view");

  if (!hasPermission) return <AccessDenied permission={requiredPermission} />;

  return children || <Outlet />;
};

export default PrivateRoute;
