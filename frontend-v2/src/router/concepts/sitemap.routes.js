// src/routes/concepts/sitemap.routes.js
import { Icons } from "../icons.config";

import SiteMapList from "../../pages/SiteMap/SiteMapList";
import AddSiteMap from "../../pages/SiteMap/AddSiteMap";
import SiteMapDetails from "../../pages/SiteMap/SiteMapDetails";
import NewSiteMapDetails from "../../pages/SiteMap/NewSiteMapDetails";

export const sitemapRoutes = [
  {
    path: "/site-map/list",
    name: "Site Maps",
    icon: Icons.list,
    element: <SiteMapList />,
  },
  {
    path: "/site-map/add",
    name: "Add Site Map",
    icon: Icons.list,
    element: <AddSiteMap />,
  },
  {
    path: "/site-map/:id/edit",
    name: "Edit Site Map",
    icon: Icons.list,
    element: <AddSiteMap />,
  },
  {
    path: "/site-map/:id/new",
    name: "New Site Map",
    icon: Icons.list,
    element: <SiteMapDetails />,
  },
  {
    path: "/site-map/:id",
    name: "Site Map Details",
    icon: Icons.list,
    element: <NewSiteMapDetails />,
  },
];