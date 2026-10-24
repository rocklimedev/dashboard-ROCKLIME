import Loader from '../components/Common/Loader';
import './Router.styles.css';
import React, { Suspense } from 'react';

import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

import masterRoutes from './routes'; // Assuming this combines all routes
import PrivateRoute from './PrivateRoute';
import RouteErrorBoundary from './RouteErrorBoundary';
import { appPermission, pagePermission } from './pagePermissions';

const RouteWithHelmet = ({ element, name, hasSidebar }) => (
  <RouteErrorBoundary area={name || 'This screen'} hasSidebar={hasSidebar}>
    {name && (
      <Helmet>
        <title>{`CM Trading Co - ${name}`}</title>
      </Helmet>
    )}
    {element}
  </RouteErrorBoundary>
);

const generateRoutes = (routes, hasSidebar) =>
  routes.flatMap(({ path, name, element, requiredPermission, submenu, children }) => {
    const routesArray = [];

    if (path && element) {
      requiredPermission = requiredPermission || pagePermission(path);
      const requiredAppPermission = appPermission(path);
      const routeElement =
        requiredPermission || requiredAppPermission ? (
          <PrivateRoute
            requiredPermission={requiredPermission}
            requiredAppPermission={requiredAppPermission}
          >
            <RouteWithHelmet element={element} name={name} hasSidebar={hasSidebar} />
          </PrivateRoute>
        ) : (
          <RouteWithHelmet element={element} name={name} hasSidebar={hasSidebar} />
        );

      if (children && children.length > 0) {
        // This is a Layout Route (like CartLayout)
        routesArray.push(
          <Route key={path} path={path} element={routeElement}>
            {children.map((child, index) => (
              <Route
                key={index}
                index={child.index}
                path={child.path}
                element={
                  <RouteWithHelmet
                    element={child.element}
                    name={child.name || name}
                    hasSidebar={hasSidebar}
                  />
                }
              />
            ))}
          </Route>,
        );
      } else {
        // Normal flat route
        routesArray.push(<Route key={path} path={path} element={routeElement} />);
      }
    }

    // Handle submenu recursively (if any)
    if (submenu && submenu.length > 0) {
      routesArray.push(...generateRoutes(submenu, hasSidebar));
    }

    return routesArray;
  });

// Each screen is loaded on first use (smaller first download).
const PageLoading = () => (
  <div className="page-wrapper">
    <div className="content fv2-router-1c102d3d00">
      <Loader size="large" />
    </div>
  </div>
);

const Router = ({ hasSidebar = true }) => (
  <Suspense fallback={<PageLoading />}>
    <Routes>
      {generateRoutes(masterRoutes, hasSidebar)}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  </Suspense>
);

export default Router;
