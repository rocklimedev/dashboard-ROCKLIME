import Loader from '../components/Common/Loader';
import React from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import useCan, { useRoles } from '../utils/useCan';
import { useGetSettingsQuery } from '../api/settingsApi';
import { appForPath, configuredApps } from '../apps/registry';
import { ADMIN_ROLES } from '../apps/registry';
import AccessDenied from '../concepts/Error/AccessDenied';

const PrivateRoute = ({ requiredPermission, requiredAppPermission, children }) => {
  const { auth, authChecked, isLoadingPermissions } = useAuth();
  const can = useCan();
  const roles = useRoles();
  const location = useLocation();
  const {
    data: settings,
    isLoading: loadingAppSettings,
    isError: appSettingsError,
    refetch: refetchSettings,
  } = useGetSettingsQuery(undefined, { skip: !auth?.token });
  const app = appForPath(
    location.pathname,
    configuredApps(settings?.data?.apps, roles),
    location.search,
  );

  if (!authChecked) return <Loader size="large" />;
  if (!auth?.token) return <Navigate to="/login" replace />;

  if (isLoadingPermissions && !auth?.permissions)
    return (
      <div className="page-wrapper">
        <div className="content">
          <Loader size="large" />
        </div>
      </div>
    );

  if (loadingAppSettings) return <Loader size="large" />;
  // A background refresh failure does not revoke the last confirmed access.
  // Without any settings yet, offer recovery without claiming access was denied.
  if (appSettingsError && !settings) {
    return (
      <div className="page-wrapper">
        <div className="content" role="alert">
          <p>Unable to load app settings. Please try again.</p>
          <button type="button" onClick={refetchSettings}>
            Try again
          </button>
        </div>
      </div>
    );
  }
  if (app?.locked) return <AccessDenied />;

  // Every inside route needs app view access, even if its page action is granted.
  if (requiredAppPermission && !can(requiredAppPermission.module, 'view')) {
    return <AccessDenied permission={requiredAppPermission} />;
  }

  // If no permission required, allow by default
  if (!requiredPermission) return children || <Outlet />;

  const { api, action, module, adminOnly } = requiredPermission;

  const hasPermission = adminOnly
    ? roles.some((role) => ADMIN_ROLES.includes(role))
    : can(module, action || api || 'view');

  if (!hasPermission) return <AccessDenied permission={requiredPermission} />;

  return children || <Outlet />;
};

export default PrivateRoute;
