// src/routes/purchaseRoutes.js
import { FaShoppingCart, FaFileAlt } from "react-icons/fa";
import PurchaseManagement from "../../concepts/PO/PurchaseManagement";
import AddPurchaseOrder from "../../concepts/PO/AddPurchaseOrder";
import PODetails from "../../concepts/PO/PODetails";

export const purchaseRoutes = [
  {
    path: "/purchase-manager",
    name: "Purchase Manager",
    icon: <FaShoppingCart />,
    element: <PurchaseManagement />,
    isSidebarActive: true,
  },
  {
    path: "/po/add",
    name: "Add Purchase Order",
    icon: <FaFileAlt />,
    isSidebarActive: false,
    element: <AddPurchaseOrder />,
    requiredPermission: { api: "write", module: "purchase_orders" },
  },
  {
    path: "/po/:id",
    name: "PO Details",
    icon: <FaFileAlt />,
    element: <PODetails />,
    isSidebarActive: false,
  },
  {
    path: "/po/:id/edit",
    name: "Edit Purchase Order",
    icon: <FaFileAlt />,
    isSidebarActive: false,
    element: <AddPurchaseOrder />,
    requiredPermission: { api: "edit", module: "purchase_orders" },
  },
];