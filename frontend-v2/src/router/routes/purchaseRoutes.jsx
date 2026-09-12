// src/routes/purchaseRoutes.js
import { FaShoppingCart, FaFileAlt } from "react-icons/fa";
import PurchaseManagement from "../../concepts/PO/PurchaseManagement";
import AddPurchaseOrder from "../../concepts/PO/AddPurchaseOrder";
import PODetails from "../../concepts/PO/PODetails";

export const purchaseRoutes = [
  {
    path: "/po/add",
    name: "Add Purchase Order",
    icon: <FaFileAlt />,
    isSidebarActive: false,
    element: <AddPurchaseOrder />,
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
  },
];
