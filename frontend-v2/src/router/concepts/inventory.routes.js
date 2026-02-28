// src/routes/concepts/inventory.routes.js
import { Icons } from "../icons.config";

import InventoryWrapper from "../../pages/Inventory/InventoryWrapper";
import CategoryManagement from "../../pages/Category/CategoryManagement";

export const inventoryRoutes = [
  {
    path: "/inventory/list",
    name: "Inventory",
    icon: Icons.inventory,
    element: <InventoryWrapper />,
  },
  {
    path: "/inventory/categories-keywords",
    name: "Categories",
    icon: Icons.list,
    element: <CategoryManagement />,
  },
];