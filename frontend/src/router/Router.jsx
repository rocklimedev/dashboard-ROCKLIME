import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import masterRoutes from "../data/routes";

const renderRoutes = (routes) => {
  return routes.flatMap(({ path, element, submenu }) => {
    const mainRoute = element ? <Route key={path} path={path} element={element} /> : null;
    const subRoutes = submenu ? renderRoutes(submenu) : [];
    return mainRoute ? [mainRoute, ...subRoutes] : subRoutes;
  });
};

const Router = () => {
  return (
    <Routes>
      {renderRoutes(masterRoutes)}
      <Route path="*" element={<Navigate to="/404" />} />
    </Routes>
  );
};

export default Router;
