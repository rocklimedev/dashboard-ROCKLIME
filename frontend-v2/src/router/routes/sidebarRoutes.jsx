import {
  FaHome,
  FaTags,
  FaFileAlt,
  FaUsers,
  FaThLarge,
  FaUser,
  FaListUl,
  FaIdCard,
  FaBoxOpen,
} from "react-icons/fa";

import { MdOutlineInventory2, MdLocalActivity } from "react-icons/md";
import DevicesPage from "../../concepts/Assets/DevicesPage";
import { FaShoppingCart, FaStore } from "react-icons/fa";
import { FaExclamationCircle } from "react-icons/fa";
import CategoryManagement from "../../concepts/Products/CategoryManagement";
import PurchaseManagement from "../../concepts/PO/PurchaseManagement";
import Product from "../../concepts/Products/Product";
import OrderWrapper from "../../concepts/Order/OrderWrapper";
import QuotationList from "../../concepts/Quotation/QuotationList";
import InventoryWrapper from "../../concepts/Products/InventoryWrapper";
import UserList from "../../concepts/User/UserList";
import RolePermission from "../../concepts/RBAC/RolePermission";
import CustomerList from "../../concepts/Customers/CustomerList";
import BrandList from "../../concepts/Brands/BrandsList";
import ReportsPage from "../../concepts/Reports/page";
import ActivityLogsPage from "../../concepts/Activity/page";
import ReportDashboard from "../../concepts/Home/ReportDashboard";
import NewDashboard from "../../concepts/Home/NewPageWrapper";
import DispatchHistory from "../../concepts/Order/DispatchHistory";
import { useAuth } from "../../context/AuthContext";

// ============================================================
// ROLE BASED DASHBOARD
// ============================================================

const RoleBasedDashboard = () => {
  const { auth } = useAuth();

  const roles = Array.isArray(auth?.user?.roles) ? auth.user.roles : [];

  const isAdmin = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");

  return isAdmin ? <ReportDashboard /> : <NewDashboard />;
};

// ============================================================
// SIDEBAR ROUTES
// ============================================================

export const sidebarRoutes = [
  {
    path: "/",
    name: "Dashboard",
    icon: <FaHome />,
    isSidebarActive: true,
    element: <RoleBasedDashboard />,
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
    path: "/orders/dispatch/all",
    name: "Dispatch History",
    icon: <FaFileAlt />,
    element: <DispatchHistory />,
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
    path: "/devices",
    name: "Devices",
    element: <DevicesPage />,
    isSidebarActive: true,
    icon: <FaExclamationCircle />,
  },
  {
    path: "/reports/list",
    name: "Reports",
    icon: <FaListUl />,
    isSidebarActive: true,
    element: <ReportsPage />,
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
        path: "/meta/list",
        name: "Meta",
        icon: <FaStore />,
        isSidebarActive: true,
        element: <BrandList />,
      },

      {
        path: "/categories-keywords/list",
        name: "Categories",
        icon: <FaThLarge />,
        element: <CategoryManagement />,
        isSidebarActive: true,
      },

      {
        path: "/activity-logs",
        name: "Activity Logs",
        icon: <MdLocalActivity />,
        isSidebarActive: true,
        element: <ActivityLogsPage />,
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
