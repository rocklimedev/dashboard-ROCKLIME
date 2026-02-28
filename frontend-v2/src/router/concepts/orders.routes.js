// src/routes/concepts/orders.routes.js
import { Icons } from "../icons.config";

import OrderWrapper from "../../pages/Orders/OrderWrapper";
import OrderPage from "../../pages/Orders/Orderpage";
import AddNewOrder from "../../pages/Orders/AddNewOrder";
import TeamsList from "../../components/Orders/TeamsList";

export const orderRoutes = [
  {
    path: "/orders/list",
    name: "Orders",
    icon: Icons.percentage,
    element: <OrderWrapper />,
  },
  {
    path: "/order/add",
    name: "Add Order",
    icon: Icons.file,
    element: <AddNewOrder />,
    requiredPermission: { api: "write", module: "orders" }
  },
  {
    path: "/order/:id",
    name: "Order Details",
    icon: Icons.file,
    element: <OrderPage />,
  },
  {
    path: "/order/:id/edit",
    name: "Edit Order",
    icon: Icons.dashboard,
    element: <AddNewOrder />,
    requiredPermission: { api: "edit", module: "orders" }
  },
  {
    path: "/orders/teams",
    name: "Teams",
    icon: Icons.users,
    element: <TeamsList />,
  },
];