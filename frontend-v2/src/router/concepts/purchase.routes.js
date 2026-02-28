// src/routes/concepts/purchase.routes.js
import { Icons } from "../icons.config";

import PurchaseManagement from "../../pages/PO/PurchaseManagement";
import AddPurchaseOrder from "../../pages/PO/AddPurchaseOrder";
import PODetails from "../../pages/PO/PODetails";

export const purchaseRoutes = [
  {
    path: "/purchase-manager",
    name: "Purchase Manager",
    icon: Icons.cart,
    element: <PurchaseManagement />,
  },
  {
    path: "/po/add",
    name: "Add Purchase Order",
    icon: Icons.file,
    element: <AddPurchaseOrder />,
    requiredPermission: { api: "write", module: "purchase_orders" }
  },
  {
    path: "/po/:id",
    name: "PO Details",
    icon: Icons.file,
    element: <PODetails />,
  },
  {
    path: "/po/:id/edit",
    name: "Edit PO",
    icon: Icons.file,
    element: <AddPurchaseOrder />,
    requiredPermission: { api: "edit", module: "purchase_orders" }
  },
];