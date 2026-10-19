import { lazy } from "react";
// src/routes/orderRoutes.js
import { FaFileAlt, FaUsers } from "react-icons/fa";
const AddNewOrder = lazy(() => import("../../concepts/Order/AddNewOrder"));
const OrderPage = lazy(() => import("../../concepts/Order/Orderpage"));
const OrderWrapper = lazy(() => import("../../concepts/Order/OrderWrapper"));
const DispatchDetails = lazy(() => import("../../concepts/Order/DispatchDetails"));
const DispatchHistory = lazy(() => import("../../concepts/Order/DispatchHistory"));

export const orderRoutes = [
  { path: "/dispatch/:dispatchId", name: "Dispatch Details", element: <DispatchDetails />, isSidebarActive: false },
  {
    path: "/orders/list",
    name: "Orders",
    icon: <FaFileAlt />,
    element: <OrderWrapper />,
    isSidebarActive: true,
  },
  {
    path: "/order/add",
    name: "Add Order",
    icon: <FaFileAlt />,
    isSidebarActive: false,
    element: <AddNewOrder />,
  },
  {
    path: "/order/:id",
    name: "Order Details",
    icon: <FaFileAlt />,
    isSidebarActive: false,
    element: <OrderPage />,
  },
  {
    path: "/order/:id/edit",
    name: "Edit Order",
    icon: <FaFileAlt />,
    isSidebarActive: false,
    element: <AddNewOrder />,
  },
  {
    path: "/orders/dispatch/all",
    name: "Dispatch History",
    icon: <FaFileAlt />,
    element: <DispatchHistory />,
    isSidebarActive: true,
  },
];
