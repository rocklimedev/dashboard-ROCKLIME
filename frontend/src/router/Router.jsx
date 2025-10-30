import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import masterRoutes from "../data/routes";
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
  routes.flatMap(({ path, name, element, requiredPermission, submenu }) => {
    const routesArray = [];

    if (path && element) {
      if (requiredPermission) {
        const { api, module } = requiredPermission;

        routesArray.push(
          <Route
            key={path}
            element={<PrivateRoute api={api} module={module} />}
          >
            <Route
              path={path}
              element={<RouteWithHelmet element={element} name={name} />}
            />
          </Route>
        );
      } else {
        routesArray.push(
          <Route
            key={path}
            path={path}
            element={<RouteWithHelmet element={element} name={name} />}
          />
        );
      }
    }

    if (submenu && submenu.length > 0) {
      routesArray.push(...generateRoutes(submenu));
    }

    return routesArray;
  });

const Router = () => (
  <Routes>
    {generateRoutes(masterRoutes)}
    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes>
);

export default Router;
