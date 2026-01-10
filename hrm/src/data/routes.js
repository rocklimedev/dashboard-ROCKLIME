import {
  FaHome, // DashboardOutlined
  FaThLarge, // AppstoreOutlined
  FaFileAlt, // FileTextOutlined
  FaUsers, // TeamOutlined / UsergroupAddOutlined
  FaUser, // UserOutlined
  FaCog, // SettingOutlined
  FaShoppingCart, // ShoppingCartOutlined
  FaListUl, // UnorderedListOutlined
  FaUserCircle, // ProfileOutlined
  FaFile, // FileOutlined
  FaTags, // TagsOutlined / TagOutlined
  FaExclamationCircle, // ExclamationCircleOutlined
  FaSignInAlt, // LoginOutlined
  FaUserTimes, // UserDeleteOutlined
  FaCheckCircle, // CheckCircleOutlined
  FaIdCard, // IdcardOutlined
  FaBell, // NotificationOutlined
  FaBoxOpen, // ContainerOutlined
  FaPercentage, // PercentageOutlined
} from "react-icons/fa";

import {
  MdOutlineInventory2, // Inventory (ContainerOutlined alternative)
} from "react-icons/md";

import ForgotPassword from "../components/Auth/ForgotPassword";
import Login from "../components/Auth/Login";
import Signup from "../components/Auth/Signup";
import Error404 from "../components/Error/Error404";
import PageWrapper from "../components/Home/PageWrapper";
import ProductList from "../components/Product/ProductList";
import CustomerList from "../components/Customers/CustomerList";
import CustomerDetails from "../components/Customers/CustomerDetails";
import OrderWrapper from "../components/Orders/OrderWrapper";
import Profile from "../components/Profile/Profile";
import CreateProduct from "../components/Product/CreateProduct";
import ResetPassword from "../components/Auth/ResetPassword";
import QuotationList from "../components/Quotation/QuotationList";
import RolePermission from "../components/RolesPermission/RolePermission";
import Permissions from "../components/RolesPermission/Permissions";
import Error500 from "../components/Error/Error500";
import ProductDetails from "../components/Product/ProductDetails";
import UserList from "../components/User/UserList";
import GeneralSettings from "../components/Settings/GeneralSettings";
import ComingSoon from "../components/Error/ComingSoon";
import TeamsList from "../components/Orders/TeamsList";
import NoAccess from "../components/Common/NoAccess";
import NewAddUser from "../components/User/NewAddUser";
import UserPage from "../components/User/UserPage";
import Product from "../components/Product/Product";
import AddQuotation from "../components/Quotation/AddQuntation";
import QuotationsDetails from "../components/Quotation/QuotaionDetails";
import UnderMaintanance from "../components/Error/UnderMaintanance";
import AddNewOrder from "../components/Orders/AddNewOrder";
import CategoryManagement from "../components/Categories/CategoryManagement";
import BrandSelection from "../components/Product/BrandSelection";
import OrderPage from "../components/Orders/Orderpage";
import NewCart from "../components/POS-NEW/NewCart";
import AccountVerify from "../components/Auth/AccountVerify";
import AddCustomer from "../components/Customers/AddCustomer";
import EmailVerification from "../components/Auth/EmailVerifications";
import POWrapper from "../components/Orders/POWrapper";
import AddPurchaseOrder from "../components/Orders/AddPurchaseOrder";
import PODetails from "../components/Orders/PODetails";
import LogTable from "../components/Logs/LogTable";
import TaskWrapper from "../components/Tasks/TaskWrapper";
import InventoryWrapper from "../components/Common/InventoryWrapper";
import ProfileForm from "../components/Profile/ProfileForm";
import Error403 from "../components/Error/Error403";
import NewQuotationsDetails from "../components/Quotation/NewQuotationDetails";
import AddSiteMap from "../components/SiteMap/AddSiteMap";
import SiteMapList from "../components/SiteMap/SiteMapList";
import SiteMapDetails from "../components/SiteMap/SiteMapDetails";
import NewSiteMapDetails from "../components/SiteMap/NewSiteMapDetails";
import BulkProductImport from "../components/Product/BulkProductImport";

const masterRoutes = [
  {
    path: "/",
    name: "Dashboard",
    icon: <FaHome />,
    isSidebarActive: true,
    element: <PageWrapper />,
    submenu: [],
  },

  {
    path: "/tasks",
    name: "Tasks",
    icon: <FaBoxOpen />,
    isSidebarActive: false,
    element: <TaskWrapper />,
  },
  {
    path: "/roles-permission/list",
    name: "Roles",
    icon: <FaIdCard />,
    element: <RolePermission />,
    isSidebarActive: true,
  },
  {
    path: "/users/list",
    name: "Users",
    icon: <FaUser />,
    isSidebarActive: true,
    element: <UserList />,
  },
  {
    path: "/orders/teams",
    name: "Teams",
    icon: <FaUsers />,
    element: <TeamsList />,
    isSidebarActive: true,
  },
  {
    path: "#",
    name: "Master Table",
    icon: <FaBoxOpen />,
    isSidebarActive: false,
    submenu: [
      {
        path: "/user/add",
        name: "Create User",
        icon: <FaUser />,
        isSidebarActive: false,
        element: <NewAddUser />,
      },
      {
        path: "/user/:userId",
        name: "User Details",
        icon: <FaUser />,
        isSidebarActive: false,
        element: <UserPage />,
      },
      {
        path: "/user/:userId/edit",
        name: "Edit User",
        icon: <FaUser />,
        isSidebarActive: false,
        element: <NewAddUser />,
      },
    ],
  },
  {
    path: "#",
    name: "Others",
    icon: <FaCheckCircle />,
    isSidebarActive: false,
    submenu: [
      {
        path: "/settings",
        name: "Settings",
        icon: <FaCog />,
        isSidebarActive: false,
        element: <GeneralSettings />,
      },
      {
        path: "/roles-permission/permissions/:id",
        name: "Grant Permissions",
        icon: <FaUser />,
        isSidebarActive: false,
        element: <Permissions />,
        requiredPermission: { api: "view", module: "rolepermissions" },
      },
      {
        path: "/u/:id/edit",
        name: "Edit Profile",
        icon: <FaUserCircle />,
        isSidebarActive: false,
        element: <ProfileForm />,
      },
      {
        path: "/u/:id",
        name: "Profile",
        icon: <FaUserCircle />,
        isSidebarActive: false,
        element: <Profile />,
      },
      {
        path: "/verify-account",
        name: "Verify Account",
        icon: <FaSignInAlt />,
        isSidebarActive: false,
        element: <EmailVerification />,
      },
      {
        path: "/login",
        name: "Login",
        icon: <FaSignInAlt />,
        isSidebarActive: false,
        element: <Login />,
      },
      {
        path: "/no-access",
        name: "No Access",
        icon: <FaUserTimes />,
        isSidebarActive: false,
        element: <NoAccess />,
      },
      {
        path: "/signup",
        name: "Signup",
        icon: <FaSignInAlt />,
        isSidebarActive: false,
        element: <Signup />,
      },
      {
        path: "/404",
        name: "Error",
        icon: <FaExclamationCircle />,
        isSidebarActive: false,
        element: <Error404 />,
      },
      {
        path: "/403",
        name: "Error",
        icon: <FaExclamationCircle />,
        isSidebarActive: false,
        element: <Error403 />,
      },
      {
        path: "/forgot-password",
        name: "Forgot Password",
        icon: <FaExclamationCircle />,
        isSidebarActive: false,
        element: <ForgotPassword />,
      },
      {
        path: "/reset-password/:token",
        name: "Reset Password",
        icon: <FaExclamationCircle />,
        isSidebarActive: false,
        element: <ResetPassword />,
      },
      {
        path: "/500",
        name: "ERROR 500",
        icon: <FaExclamationCircle />,
        isSidebarActive: false,
        element: <Error500 />,
      },
      {
        path: "/under-maintenance",
        name: "Under Maintenance",
        icon: <FaExclamationCircle />,
        isSidebarActive: false,
        element: <UnderMaintanance />,
      },
      {
        path: "/coming-soon",
        name: "Coming Soon",
        icon: <FaExclamationCircle />,
        isSidebarActive: false,
        element: <ComingSoon />,
      },
    ],
  },
];

export default masterRoutes;
