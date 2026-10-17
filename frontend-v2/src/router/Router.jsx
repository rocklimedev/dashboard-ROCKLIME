import React, { Suspense } from "react";
import { Spin } from "antd";
import { Routes, Route, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";

import masterRoutes from "./routes"; // Assuming this combines all routes
import PrivateRoute from "./PrivateRoute";

const RouteWithHelmet = ({ element, name }) => (
  <>
    {name && (
      <Helmet>
        <title>{`CM Trading Co - ${name}`}</title>
      </Helmet>
    )}
    {element}
  </>
);

const generateRoutes = (routes) =>
  routes.flatMap(
    ({ path, name, element, requiredPermission, submenu, children }) => {
      const routesArray = [];

      if (path && element) {
        const routeElement = requiredPermission ? (
          <PrivateRoute requiredPermission={requiredPermission}>
            <RouteWithHelmet element={element} name={name} />
          </PrivateRoute>
        ) : (
          <RouteWithHelmet element={element} name={name} />
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
                    />
                  }
                />
              ))}
            </Route>,
          );
        } else {
          // Normal flat route
          routesArray.push(
            <Route key={path} path={path} element={routeElement} />,
          );
        }
      }

      // Handle submenu recursively (if any)
      if (submenu && submenu.length > 0) {
        routesArray.push(...generateRoutes(submenu));
      }

      return routesArray;
    },
  );

// Each screen is loaded on first use (smaller first download).
const PageLoading = () => (
  <div className="page-wrapper">
    <div className="content" style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
      <Spin size="large" />
    </div>
  </div>
);

const Router = () => (
  <Suspense fallback={<PageLoading />}>
    <Routes>
      {generateRoutes(masterRoutes)}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  </Suspense>
);

export default Router;
