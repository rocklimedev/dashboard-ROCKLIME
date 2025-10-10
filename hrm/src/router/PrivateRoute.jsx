import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const PrivateRoute = ({ requiredPermission }) => {
  const { isAuthenticated, permissions } = useSelector((state) => state.user);

  // Check if the user is authenticated and has the required permission
  const hasPermission = requiredPermission
    ? permissions.includes(requiredPermission)
    : true;

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission) {
    // Redirect to unauthorized page if permission is missing
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and has permission, render the route
  return <Outlet />;
};

export default PrivateRoute;
