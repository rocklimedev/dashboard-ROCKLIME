// src/routes/orderRoutes.js
import { FaFileAlt, FaUsers } from "react-icons/fa";
import OrderWrapper from "../../concepts/Orders/OrderWrapper";
import AddNewOrder from "../../concepts/Orders/AddNewOrder";
import OrderPage from "../../concepts/Orders/Orderpage";
import TeamsList from "../../concepts/Orders/TeamsList";

export const orderRoutes = [
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
    requiredPermission: { api: "write", module: "orders" },
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
    requiredPermission: { api: "edit", module: "orders" },
  },
  {
    path: "/orders/teams",
    name: "Teams",
    icon: <FaUsers />,
    element: <TeamsList />,
    isSidebarActive: false,
  },
];