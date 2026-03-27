// src/routes/orderRoutes.js
import { FaFileAlt, FaUsers } from "react-icons/fa";
import AddNewOrder from "../../concepts/Order/AddNewOrder";
import OrderPage from "../../concepts/Order/Orderpage";
import OrderWrapper from "../../concepts/Order/OrderWrapper";
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
];
