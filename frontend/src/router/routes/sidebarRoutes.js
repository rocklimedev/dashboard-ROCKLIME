// src/routes/sidebarRoutes.js
import {
  FaHome,
  FaTags,
  FaFileAlt,
  FaUsers,
  FaThLarge,
  FaUser,
  FaIdCard,
  FaCog,
  FaBoxOpen,
} from "react-icons/fa";

import { MdOutlineInventory2, MdOutlineCategory } from "react-icons/md";

import { FaShoppingCart, FaStore } from "react-icons/fa";

import PurchaseManagement from "../../concepts/PO/PurchaseManagement";
import Product from "../../concepts/Products/Product";
import OrderWrapper from "../../concepts/Order/OrderWrapper";
import QuotationList from "../../concepts/Quotation/QuotationList";
import InventoryWrapper from "../../concepts/Products/InventoryWrapper";
import UserList from "../../concepts/User/UserList";
import RolePermission from "../../concepts/RBAC/RolePermission";
import NewPageWrapper from "../../concepts/Home/NewPageWrapper";
import CustomerList from "../../concepts/Customers/CustomerList";
import BrandList from "../../concepts/Brands/BrandsList";

export const sidebarRoutes = [
  {
    path: "/",
    name: "Dashboard",
    icon: <FaHome />,
    isSidebarActive: true,
    element: <NewPageWrapper />,
  },
  {
    path: "/category-selector",
    name: "Products",
    element: <Product />,
    icon: <FaThLarge />,
    isSidebarActive: true,
  },

  {
    path: "/quotations/list",
    name: "Quotations",
    icon: <FaTags />,
    element: <QuotationList />,
    isSidebarActive: true,
  },
  {
    path: "/orders/list",
    name: "Orders",
    icon: <FaFileAlt />,
    element: <OrderWrapper />,
    isSidebarActive: true,
  },
  {
    path: "/purchase-manager",
    name: "Purchase Manager",
    icon: <FaShoppingCart />,
    element: <PurchaseManagement />,
    isSidebarActive: true,
  },
  {
    path: "/inventory/list",
    name: "Inventory",
    icon: <MdOutlineInventory2 />,
    isSidebarActive: true,
    element: <InventoryWrapper />,
  },
  {
    path: "/customers/list",
    name: "Customers",
    icon: <FaUsers />,
    isSidebarActive: true,
    element: <CustomerList />,
  },

  {
    path: "#",
    name: "Master Data",
    icon: <FaBoxOpen />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/users/list",
        name: "Users",
        icon: <FaUser />,
        isSidebarActive: true,
        element: <UserList />,
      },
      {
        path: "/brands/list",
        name: "Brands",
        icon: <FaStore />, // ✅ Better icon for Brands
        isSidebarActive: true,
        element: <BrandList />,
      },
      {
        path: "/roles-permission/list",
        name: "Roles & Permissions",
        icon: <FaIdCard />,
        isSidebarActive: true,
        element: <RolePermission />,
      },
    ],
  },
];
