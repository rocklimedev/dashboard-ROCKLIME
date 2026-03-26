// src/routes/customerRoutes.js
import { FaUsers } from "react-icons/fa";
import CustomerDetails from "../../concepts/Customers/CustomerDetails";
import AddCustomer from "../../concepts/Customers/AddCustomer";

export const customerRoutes = [
  {
    path: "/customer/:id",
    name: "Customer Details",
    icon: <FaUsers />,
    isSidebarActive: false,
    element: <CustomerDetails />,
  },
  {
    path: "/customer/add",
    name: "Add Customer",
    icon: <FaUsers />,
    isSidebarActive: false,
    element: <AddCustomer />,
  },
  {
    path: "/customer/edit/:customerId",
    name: "Edit Customer",
    icon: <FaUsers />,
    isSidebarActive: false,
    element: <AddCustomer />,
  },
];
