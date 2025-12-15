import {
  DashboardOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  UnorderedListOutlined,
  ProfileOutlined,
  FileOutlined,
  TagsOutlined,
  ExclamationCircleOutlined,
  LoginOutlined,
  UserDeleteOutlined,
  CheckCircleOutlined,
  IdcardOutlined,
  TagOutlined,
  NotificationOutlined,
  ContainerOutlined,
  PercentageOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
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
import NotificationsWrapper from "../components/Notifications/NotificationsWrapper";
import TaskWrapper from "../components/Tasks/TaskWrapper";
import InventoryWrapper from "../components/Common/InventoryWrapper";
import ProfileForm from "../components/Profile/ProfileForm";
import Error403 from "../components/Error/Error403";
import NewQuotationsDetails from "../components/Quotation/NewQuotationDetails";
import AddSiteMap from "../components/SiteMap/AddSiteMap";
import SiteMapList from "../components/SiteMap/SiteMapList";
import SiteMapDetails from "../components/SiteMap/SiteMapDetails";
import NewSiteMapDetails from "../components/SiteMap/NewSiteMapDetails";

const masterRoutes = [
  {
    path: "/",
    name: "Dashboard",
    icon: <DashboardOutlined />,
    isSidebarActive: true,
    element: <PageWrapper />,
    submenu: [],
  },
  {
    path: "/category-selector",
    name: "Products",
    element: <Product />,
    icon: <AppstoreOutlined />,
    isSidebarActive: true,
  },
  {
    path: "/orders/list",
    name: "Orders",
    icon: <PercentageOutlined />,
    element: <OrderWrapper />,
    isSidebarActive: true,
  },
  {
    path: "/quotations/list",
    name: "Quotations",
    icon: <FileTextOutlined />,
    element: <QuotationList />,
    isSidebarActive: true,
  },
  {
    path: "/site-map/list",
    name: "Site Maps",
    icon: <UnorderedListOutlined />,
    element: <SiteMapList />,
    isSidebarActive: true,
  },
  {
    path: "/po/list",
    name: "Purchase Orders",
    icon: <UnorderedListOutlined />,
    element: <POWrapper />,
    isSidebarActive: true,
  },
  {
    path: "/customers/list",
    name: "Customers",
    icon: <UsergroupAddOutlined />,
    isSidebarActive: true,
    element: <CustomerList />,
  },

  {
    path: "/tasks",
    name: "Tasks",
    icon: <ContainerOutlined />,
    isSidebarActive: false,
    element: <TaskWrapper />,
  },
  {
    path: "/inventory/list",
    name: "Inventory",
    icon: <ContainerOutlined />,
    isSidebarActive: true,
    element: <InventoryWrapper />,
  },
  {
    path: "/cart",
    name: "Cart",
    icon: <ShoppingCartOutlined />,
    isSidebarActive: false,
    element: <NewCart />,
  },
  {
    path: "#",
    name: "Master Table",
    icon: <ContainerOutlined />,
    isSidebarActive: true,

    submenu: [
      {
        path: "/users/list",
        name: "Users",
        icon: <UserOutlined />,
        isSidebarActive: true,
        element: <UserList />,
      },
      {
        path: "/orders/teams",
        name: "Teams",
        icon: <TeamOutlined />,
        element: <TeamsList />,
        isSidebarActive: true,
      },
      {
        path: "/user/add",
        name: "Create User",
        icon: <UserOutlined />,
        isSidebarActive: false,
        element: <NewAddUser />,
      },
      {
        path: "/user/:userId",
        name: "User Details",
        icon: <UserOutlined />,
        isSidebarActive: false,
        element: <UserPage />,
      },
      {
        path: "/user/:userId/edit",
        name: "Edit User",
        icon: <UserOutlined />,
        isSidebarActive: false,
        element: <NewAddUser />,
      },
      {
        path: "/roles-permission/list",
        name: "Roles",
        icon: <IdcardOutlined />,
        element: <RolePermission />,
        isSidebarActive: true,
      },

      {
        path: "/inventory/categories-keywords",
        element: <CategoryManagement />,
        name: "Categories",
        icon: <UnorderedListOutlined />,
        isSidebarActive: true,
      },
    ],
  },
  {
    path: "#",
    name: "Others",
    icon: <CheckCircleOutlined />,
    isSidebarActive: false,
    submenu: [
      {
        path: "/site-map/add",
        name: "Add Site Map",
        icon: <UnorderedListOutlined />,
        isSidebarActive: false,
        element: <AddSiteMap />,
      },
      {
        path: "/site-map/:id/edit",
        name: "Edit Site Map",
        icon: <UnorderedListOutlined />,
        isSidebarActive: false,
        element: <AddSiteMap />,
      },
      {
        path: "/site-map/:id/new",
        name: "Edit Site Map",
        icon: <UnorderedListOutlined />,
        isSidebarActive: false,
        element: <SiteMapDetails />,
      },
      {
        path: "/site-map/:id",
        name: "Site Map Details",
        icon: <UnorderedListOutlined />,
        isSidebarActive: false,
        element: <NewSiteMapDetails />,
      },
      {
        path: "/settings",
        name: "Settings",
        icon: <SettingOutlined />,
        isSidebarActive: false,
        element: <GeneralSettings />,
      },

      {
        path: "/customer/:id",
        name: "Customer Details",
        icon: <UsergroupAddOutlined />,
        isSidebarActive: false,
        element: <CustomerDetails />,
      },

      {
        path: "/po/:id",
        name: "PO Details",
        icon: <FileTextOutlined />,
        element: <PODetails />,
        isSidebarActive: false,
      },
      {
        path: "/po/add",
        name: "Add Purchase Order",
        icon: <FileTextOutlined />,
        isSidebarActive: false,
        element: <AddPurchaseOrder />,
        requiredPermission: { api: "write", module: "purchase_orders" },
      },
      {
        path: "/po/:id/edit",
        name: "Edit Purchase Order",
        icon: <FileTextOutlined />,
        isSidebarActive: false,
        element: <AddPurchaseOrder />,
        requiredPermission: { api: "edit", module: "purchase_orders" },
      },

      {
        path: "/product/add",
        name: "Create Product",
        icon: <AppstoreOutlined />,
        isSidebarActive: false,
        element: <CreateProduct />,
        requiredPermission: { api: "write", module: "products" },
      },
      {
        path: "/product/:id",
        name: "Product Details",
        icon: <AppstoreOutlined />,
        isSidebarActive: false,
        element: <ProductDetails />,
      },
      {
        path: "/product/:productId/edit",
        name: "Edit Product",
        icon: <AppstoreOutlined />,
        isSidebarActive: false,
        element: <CreateProduct />,
        requiredPermission: { api: "edit", module: "products" },
      },
      {
        path: "/store/:id",
        name: "Products",
        icon: <AppstoreOutlined />,
        element: <ProductList />,
        isSidebarActive: false,
      },
      {
        path: "/category-selector/:bpcId",
        name: "Products",
        icon: <AppstoreOutlined />,
        element: <BrandSelection />,
        isSidebarActive: false,
      },
      {
        path: "/order/:id",
        name: "Order Details",
        icon: <FileTextOutlined />,
        isSidebarActive: false,
        element: <OrderPage />,
      },
      {
        path: "/order/add",
        name: "Add Order",
        icon: <FileTextOutlined />,
        isSidebarActive: false,
        element: <AddNewOrder />,
        requiredPermission: { api: "write", module: "orders" },
      },
      {
        path: "/order/:id/edit",
        name: "Edit Order",
        icon: <DashboardOutlined />,
        isSidebarActive: false,
        element: <AddNewOrder />,
        requiredPermission: { api: "edit", module: "orders" },
      },

      {
        path: "/quotation/:id",
        name: "Quotations Details",
        icon: <TagOutlined />,
        isSidebarActive: false,
        element: <NewQuotationsDetails />,
        requiredPermission: { api: "view", module: "quotations" },
      },
      {
        path: "/quotation/add",
        name: "Add Quotations",
        icon: <TagOutlined />,
        element: <AddQuotation />,
        isSidebarActive: false,
        requiredPermission: { api: "write", module: "quotations" },
      },
      {
        path: "/quotation/:id/view",
        name: "View Quotations",
        icon: <TagOutlined />,
        element: <QuotationsDetails />,
        isSidebarActive: false,
      },
      {
        path: "/quotation/:id/edit",
        name: "Edit Quotations",
        icon: <TagOutlined />,
        element: <AddQuotation />,
        isSidebarActive: false,
        requiredPermission: { api: "edit", module: "quotations" },
      },
      {
        path: "/roles-permission/permissions/:id",
        name: "Grant Permissions",
        icon: <UserOutlined />,
        isSidebarActive: false,
        element: <Permissions />,
        requiredPermission: { api: "view", module: "rolepermissions" },
      },
      {
        path: "/u/:id/edit",
        name: "Edit Profile",
        icon: <ProfileOutlined />,
        isSidebarActive: false,
        element: <ProfileForm />,
      },
      {
        path: "/u/:id",
        name: "Profile",
        icon: <ProfileOutlined />,
        isSidebarActive: false,
        element: <Profile />,
      },
      {
        path: "/verify-account",
        name: "Veriy Account",
        icon: <LoginOutlined />,
        isSidebarActive: false,
        element: <EmailVerification />,
      },
      {
        path: "/login",
        name: "login",
        icon: <LoginOutlined />,
        isSidebarActive: false,
        element: <Login />,
      },

      {
        path: "/no-access",
        name: "No Access",
        icon: <UserDeleteOutlined />,
        isSidebarActive: false,
        element: <NoAccess />,
      },
      {
        path: "/signup",
        name: "Signup",
        icon: <LoginOutlined />,
        isSidebarActive: false,
        element: <Signup />,
      },
      {
        path: "/404",
        name: "Error",
        icon: <ExclamationCircleOutlined />,
        isSidebarActive: false,
        element: <Error404 />,
      },
      {
        path: "/403",
        name: "Error",
        icon: <ExclamationCircleOutlined />,
        isSidebarActive: false,
        element: <Error403 />,
      },
      {
        path: "/forgot-password",
        name: "Forgot Password",
        icon: <ExclamationCircleOutlined />,
        isSidebarActive: false,
        element: <ForgotPassword />,
      },
      {
        path: "/reset-password/:token",
        name: "Reset Password",
        icon: <ExclamationCircleOutlined />,
        isSidebarActive: false,
        element: <ResetPassword />,
      },
      {
        path: "/500",
        name: "ERROR 500",
        icon: <ExclamationCircleOutlined />,
        isSidebarActive: false,
        element: <Error500 />,
      },
      {
        path: "/under-maintenance",
        name: "Under Maintenance",
        icon: <ExclamationCircleOutlined />,
        isSidebarActive: false,
        element: <UnderMaintanance />,
      },
      {
        path: "/coming-soon",
        name: "Coming Soon",
        icon: <ExclamationCircleOutlined />,
        isSidebarActive: false,
        element: <ComingSoon />,
      },
      {
        path: "/customer/add",
        element: <AddCustomer />,
        name: "Add Customer",
        icon98: <ShoppingCartOutlined />,
        isSidebarActive: false,
        requiredPermission: { api: "write", module: "customers" },
      },
      {
        path: "/customer/edit/:customerId",
        element: <AddCustomer />,
        name: "Edit Customer",
        icon: <ShoppingCartOutlined />,
        isSidebarActive: false,
        requiredPermission: { api: "edit", module: "customers" },
      },
      {
        path: "/notifications",
        name: "Notifications",
        icon: <NotificationOutlined />,
        isSidebarActive: false,
        element: <NotificationsWrapper />,
      },
    ],
  },
  {
    path: "/logging",
    name: "Logs",
    icon: <FileOutlined />,
    element: <LogTable />,
    isSidebarActive: false,
  },
];

export default masterRoutes;
