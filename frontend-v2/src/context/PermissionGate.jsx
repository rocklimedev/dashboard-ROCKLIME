// src/context/PermissionGate.jsx OR .tsx
import React from "react";
import { useAuth } from "./AuthContext";

const PermissionGate = ({
  api, // e.g. "edit", "edit|delete", "write"
  module, // e.g. "products", "cart"
  children,
  fallback = null,
  any = true, // true = OR logic (default), false = AND logic
}) => {
  const { auth } = useAuth();
  const permissions = auth?.permissions || [];

  if (!api || !module) return children; // no restriction → show

  const requiredActions = api
    .split("|")
    .map((a) => a.trim())
    .filter(Boolean);

  const hasPermission = permissions.some((perm) => {
    const matchesModule = perm.module === module;
    const matchesAction = requiredActions.includes(perm.action);
    return matchesModule && matchesAction;
  });

  // If 'any={false}' → require ALL actions (rarely used)
  if (!any) {
    const hasAll = requiredActions.every((action) =>
      permissions.some((p) => p.module === module && p.action === action)
    );
    return hasAll ? children : fallback;
  }

  return hasPermission ? children : fallback;
};

export default PermissionGate;
