// src/routes/concepts/customers.routes.js
import { Icons } from "../icons.config";

import CustomerList from "../../pages/Customers/CustomerList";
import CustomerDetails from "../../pages/Customers/CustomerDetails";
import AddCustomer from "../../components/Customers/AddCustomer";

export const customerRoutes = [
  {
    path: "/customers/list",
    name: "Customers",
    icon: Icons.users,
    element: <CustomerList />,
  },
  {
    path: "/customer/add",
    name: "Add Customer",
    icon: Icons.cart,
    element: <AddCustomer />,
    requiredPermission: { api: "write", module: "customers" }
  },
  {
    path: "/customer/:id",
    name: "Customer Details",
    icon: Icons.users,
    element: <CustomerDetails />,
  },
  {
    path: "/customer/edit/:customerId",
    name: "Edit Customer",
    icon: Icons.cart,
    element: <AddCustomer />,
    requiredPermission: { api: "edit", module: "customers" }
  }
];