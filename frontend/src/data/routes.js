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
import SearchPage from "../components/Search/Search";
import FGSWrapper from "../components/Orders/FgsWrapper";
import AddFieldGuidedSheet from "../components/Orders/AddFgs";
import FGSDetails from "../components/Orders/FGSDetails";
import PurchaseManagement from "../components/Orders/PurchaseManagement";
import JobList from "../components/Jobs/JobsList";
import JobDetails from "../components/Jobs/JobDetails";
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
    path: "/category-selector",
    name: "Products",
    element: <Product />,
    icon: <FaThLarge />,
    isSidebarActive: true,
  },
  {
    path: "/orders/list",
    name: "Orders",
    icon: <FaPercentage />,
    element: <OrderWrapper />,
    isSidebarActive: true,
  },
  {
    path: "/quotations/list",
    name: "Quotations",
    icon: <FaFileAlt />,
    element: <QuotationList />,
    isSidebarActive: true,
  },
  {
    path: "/site-map/list",
    name: "Site Maps",
    icon: <FaListUl />,
    element: <SiteMapList />,
    isSidebarActive: true,
  },

  {
    path: "/purchase-manager",
    element: <PurchaseManagement />,
    name: "Purchase Manager",
    icon: <FaShoppingCart />,
    isSidebarActive: true,
  },

  {
    path: "/customers/list",
    name: "Customers",
    icon: <FaUsers />,
    isSidebarActive: true,
    element: <CustomerList />,
  },
  {
    path: "/jobs/list",
    element: <JobList />,
    name: "Jobs",
    icon: <FaBell />,
    isSidebarActive: true,
  },
  {
    path: "/tasks",
    name: "Tasks",
    icon: <FaBoxOpen />,
    isSidebarActive: false,
    element: <TaskWrapper />,
  },
  {
    path: "/inventory/list",
    name: "Inventory",
    icon: <MdOutlineInventory2 />,
    isSidebarActive: true,
    element: <InventoryWrapper />,
  },
  {
    path: "/cart",
    name: "Cart",
    icon: <FaShoppingCart />,
    isSidebarActive: false,
    element: <NewCart />,
  },
  {
    path: "#",
    name: "Master Table",
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
        path: "/orders/teams",
        name: "Teams",
        icon: <FaUsers />,
        element: <TeamsList />,
        isSidebarActive: true,
      },
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
      {
        path: "/roles-permission/list",
        name: "Roles",
        icon: <FaIdCard />,
        element: <RolePermission />,
        isSidebarActive: true,
      },
      {
        path: "/inventory/categories-keywords",
        element: <CategoryManagement />,
        name: "Categories",
        icon: <FaListUl />,
        isSidebarActive: true,
      },
    ],
  },
  {
    path: "#",
    name: "Others",
    icon: <FaCheckCircle />,
    isSidebarActive: false,
    submenu: [
      // ... (all your nested routes remain unchanged, only icons updated where needed)
      {
        path: "/site-map/add",
        name: "Add Site Map",
        icon: <FaListUl />,
        isSidebarActive: false,
        element: <AddSiteMap />,
      },
      {
        path: "/site-map/:id/edit",
        name: "Edit Site Map",
        icon: <FaListUl />,
        isSidebarActive: false,
        element: <AddSiteMap />,
      },
      {
        path: "/site-map/:id/new",
        name: "Edit Site Map",
        icon: <FaListUl />,
        isSidebarActive: false,
        element: <SiteMapDetails />,
      },
      {
        path: "/search",
        name: "Search  Results",
        icon: <FaListUl />,
        isSidebarActive: false,
        element: <SearchPage />,
      },
      {
        path: "/site-map/:id",
        name: "Site Map Details",
        icon: <FaListUl />,
        isSidebarActive: false,
        element: <NewSiteMapDetails />,
      },
      {
        path: "/settings",
        name: "Settings",
        icon: <FaCog />,
        isSidebarActive: false,
        element: <GeneralSettings />,
      },
      {
        path: "/customer/:id",
        name: "Customer Details",
        icon: <FaUsers />,
        isSidebarActive: false,
        element: <CustomerDetails />,
      },
      {
        path: "/po/:id",
        name: "PO Details",
        icon: <FaFileAlt />,
        element: <PODetails />,
        isSidebarActive: false,
      },
      {
        path: "/po/add",
        name: "Add Purchase Order",
        icon: <FaFileAlt />,
        isSidebarActive: false,
        element: <AddPurchaseOrder />,
        requiredPermission: { api: "write", module: "purchase_orders" },
      },
      {
        path: "/po/:id/edit",
        name: "Edit Purchase Order",
        icon: <FaFileAlt />,
        isSidebarActive: false,
        element: <AddPurchaseOrder />,
        requiredPermission: { api: "edit", module: "purchase_orders" },
      },
      {
        path: "/product/add",
        name: "Create Product",
        icon: <FaThLarge />,
        isSidebarActive: false,
        element: <CreateProduct />,
        requiredPermission: { api: "write", module: "products" },
      },
      {
        path: "/product/:id",
        name: "Product Details",
        icon: <FaThLarge />,
        isSidebarActive: false,
        element: <ProductDetails />,
      },
      {
        path: "/product/:productId/edit",
        name: "Edit Product",
        icon: <FaThLarge />,
        isSidebarActive: false,
        element: <CreateProduct />,
        requiredPermission: { api: "edit", module: "products" },
      },
      {
        path: "/store/:id",
        name: "Products",
        icon: <FaThLarge />,
        element: <ProductList />,
        isSidebarActive: false,
      },
      {
        path: "/category-selector/:bpcId",
        name: "Products",
        icon: <FaThLarge />,
        element: <BrandSelection />,
        isSidebarActive: false,
      },
      {
        path: "/order/:id",
        name: "Order Details",
        icon: <FaFileAlt />,
        isSidebarActive: false,
        element: <OrderPage />,
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
        path: "/order/:id/edit",
        name: "Edit Order",
        icon: <FaHome />,
        isSidebarActive: false,
        element: <AddNewOrder />,
        requiredPermission: { api: "edit", module: "orders" },
      },
      {
        path: "/quotation/:id",
        name: "Quotations Details",
        icon: <FaTags />,
        isSidebarActive: false,
        element: <NewQuotationsDetails />,
        requiredPermission: { api: "view", module: "quotations" },
      },
      {
        path: "/quotation/add",
        name: "Add Quotations",
        icon: <FaTags />,
        element: <AddQuotation />,
        isSidebarActive: false,
        requiredPermission: { api: "write", module: "quotations" },
      },
      {
        path: "/quotation/:id/view",
        name: "View Quotations",
        icon: <FaTags />,
        element: <QuotationsDetails />,
        isSidebarActive: false,
      },
      {
        path: "/quotation/:id/edit",
        name: "Edit Quotations",
        icon: <FaTags />,
        element: <AddQuotation />,
        isSidebarActive: false,
        requiredPermission: { api: "edit", module: "quotations" },
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
      {
        path: "/customer/add",
        element: <AddCustomer />,
        name: "Add Customer",
        icon: <FaShoppingCart />,
        isSidebarActive: false,
        requiredPermission: { api: "write", module: "customers" },
      },
      {
        path: "/customer/edit/:customerId",
        element: <AddCustomer />,
        name: "Edit Customer",
        icon: <FaShoppingCart />,
        isSidebarActive: false,
        requiredPermission: { api: "edit", module: "customers" },
      },
      {
        path: "/job/add",
        element: <BulkProductImport />,
        name: "Bulk Product",
        icon: <FaShoppingCart />,
        isSidebarActive: false,
      },

      {
        path: "/fgs/add",
        element: <AddFieldGuidedSheet />,
        name: "Add FGS",
        icon: <FaFileAlt />,
        isSidebarActive: false,
      },
      {
        path: "/fgs/:id",
        element: <FGSDetails />,
        name: "FGS",
        icon: <FaFileAlt />,
        isSidebarActive: false,
      },
      {
        path: "/fgs/:id/edit",
        element: <AddFieldGuidedSheet />,
        name: "Edit FGS",
        icon: <FaFileAlt />,
        isSidebarActive: false,
      },

      {
        path: "/job/:jobId",
        element: <JobDetails />,
        name: "Job Details",
        icon: <FaBell />,
        isSidebarActive: false,
      },
    ],
  },
  {
    path: "/logging",
    name: "Logs",
    icon: <FaFile />,
    element: <LogTable />,
    isSidebarActive: false,
  },
];

export default masterRoutes;
