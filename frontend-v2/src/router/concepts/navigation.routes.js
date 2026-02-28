// src/routes/navigation.routes.js

import { Icons } from "./icons.config";

export const navigationRoutes = [
  {
    name: "Dashboard",
    icon: Icons.dashboard,
    path: "/",
  },
  {
    name: "Products",
    icon: Icons.products,
    path: "/category-selector",
  },
  {
    name: "Orders",
    icon: Icons.percentage,
    path: "/orders/list",
  },
  {
    name: "Quotations",
    icon: Icons.file,
    path: "/quotations/list",
  },
  {
    name: "Site Maps",
    icon: Icons.list,
    path: "/site-map/list",
  },
  {
    name: "Purchase Manager",
    icon: Icons.cart,
    path: "/purchase-manager",
  },
  {
    name: "Customers",
    icon: Icons.users,
    path: "/customers/list",
  },
  {
    name: "Inventory",
    icon: Icons.inventory,
    path: "/inventory/list",
  },
  {
    name: "Master Table",
    icon: Icons.box,
    submenuKey: "master", // not path
  },
];