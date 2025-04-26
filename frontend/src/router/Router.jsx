import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import masterRoutes from "../data/routes";

// Wrapper component to apply Helmet for routes with a path and name
const RouteWithHelmet = ({ element, name }) => {
  return (
    <>
      {name && (
        <Helmet>
          <title>{`Rocklime - ${name}`}</title>
        </Helmet>
      )}
      {element}
    </>
  );
};

const renderRoutes = (routes) => {
  return routes.flatMap(({ path, name, element, submenu }) => {
    // Create main route with Helmet if it has a path
    const mainRoute =
      path && element ? (
        <Route
          key={path}
          path={path}
          element={<RouteWithHelmet element={element} name={name} />}
        />
      ) : null;

    // Recursively render sub-routes (submenu)
    const subRoutes = submenu ? renderRoutes(submenu) : [];

    // Return main route and sub-routes, filtering out null mainRoute if no path
    return mainRoute ? [mainRoute, ...subRoutes] : subRoutes;
  });
};

const Router = () => {
  return (
    <Routes>
      {renderRoutes(masterRoutes)}
      <Route
        path="*"
        element={
          <RouteWithHelmet element={<Navigate to="/404" />} name="Not Found" />
        }
      />
    </Routes>
  );
};

export default Router;
