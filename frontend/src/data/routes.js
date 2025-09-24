import {
  DashboardOutlined,
  SettingOutlined,
  AppstoreOutlined,
  UserSwitchOutlined,
  ShoppingCartOutlined,
  ApartmentOutlined,
  UserOutlined,
  DollarOutlined,
  FileProtectOutlined,
  TeamOutlined,
  ProfileOutlined,
  FileAddOutlined,
  LoginOutlined,
  DatabaseOutlined,
  TagOutlined,
  IdcardOutlined,
  FileTextOutlined,
  OrderedListOutlined,
  BookOutlined,
  UsergroupAddOutlined,
  FileDoneOutlined,
  TrademarkOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

import ForgotPassword from "../components/Auth/ForgotPassword";
import Login from "../components/Auth/Login";
import Signup from "../components/Auth/Signup";
import Error404 from "../components/Error/Error404";
import PageWrapper from "../components/Home/PageWrapper";
import ProductList from "../components/Product/ProductList";
import CustomerList from "../components/Customers/CustomerList";
import CustomerDetails from "../components/Customers/CustomerDetails";
import SignatureWrapper from "../components/Signature/SignatureWrapper";
import OrderWrapper from "../components/Orders/OrderWrapper";
import Profile from "../components/Profile/Profile";
import CreateProduct from "../components/Product/CreateProduct";
import ResetPassword from "../components/Auth/ResetPassword";
import QuotationList from "../components/Quotation/QuotationList";
import RolePermission from "../components/RolesPermission/RolePermission";
import Permissions from "../components/RolesPermission/Permissions";
import Error500 from "../components/Error/Error500";
import Brands from "../components/Brands/Brands";
import ProductDetails from "../components/Product/ProductDetails";
import UserList from "../components/User/UserList";
import GeneralSettings from "../components/Settings/GeneralSettings";
import ComingSoon from "../components/Error/ComingSoon";
import TeamsList from "../components/Orders/TeamsList";
import InvoiceDetails from "../components/Invoices/InvoiceDetails";
import NoAccess from "../components/Common/NoAccess";
import AddressList from "../components/Address/Address";
import AttendanceWrapper from "../components/Attendance/AttendanceWrapper";
import AttendanceList from "../components/Attendance/AttendanceList";
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
import ContactWrapper from "../components/Contact/ContactWrapper";
import AddCustomer from "../components/Customers/AddCustomer";
import EmailInterface from "../components/Contact/EmailInterface";
import EmailVerification from "../components/Auth/EmailVerifications";
import POWrapper from "../components/Orders/POWrapper";
import AddPurchaseOrder from "../components/Orders/AddPurchaseOrder";
import PODetails from "../components/Orders/PODetails";

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
    path: "/inventory/products",
    name: "Products",
    element: <Product />,
    icon: <DatabaseOutlined />,
    isSidebarActive: true,
  },
  {
    path: "/orders/list",
    name: "Orders",
    icon: <TagOutlined />,
    element: <OrderWrapper />,
    isSidebarActive: true,
  },
  {
    path: "/quotations/list",
    name: "Quotations",
    icon: <FileAddOutlined />,
    element: <QuotationList />,
    isSidebarActive: true,
  },
  {
    path: "/po/list",
    name: "Purchase Orders",
    icon: <OrderedListOutlined />,
    element: <POWrapper />,
    isSidebarActive: true,
  },
  {
    path: "/customers/list",
    name: "Customers",
    icon: <TeamOutlined />,
    isSidebarActive: true,
    element: <CustomerList />,
  },
  {
    path: "#",
    name: "Products",
    icon: <AppstoreOutlined />,
    isSidebarActive: false,
    submenu: [
      {
        path: "/inventory/list",
        name: "Products",
        icon: <AppstoreOutlined />,
        isSidebarActive: false,
      },
      {
        path: "/inventory/all-products/",
        name: "Products",
        icon: <AppstoreOutlined />,
        element: <Product />,
        isSidebarActive: false,
      },
    ],
  },
  {
    path: "/settings",
    name: "Settings",
    icon: <SettingOutlined />,
    isSidebarActive: false,
    element: <GeneralSettings />,
  },
  {
    path: "#",
    name: "Team",
    icon: <TeamOutlined />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/hrm/attendance/list",
        name: "HRM",
        icon: <TeamOutlined />,
        isSidebarActive: false,
        element: <AttendanceList />,
      },
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
    ],
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
    name: "Others",
    icon: <FileProtectOutlined />,
    isSidebarActive: false,
    submenu: [
      {
        path: "/customer/:id",
        name: "Customer Details",
        icon: <UsergroupAddOutlined />,
        isSidebarActive: false,
        element: <CustomerDetails />,
      },
      {
        path: "/address/list",
        name: "Address",
        icon: <BookOutlined />,
        isSidebarActive: true,
        element: <AddressList />,
      },
      {
        path: "/po/:id",
        name: "PO Details",
        icon: <FileDoneOutlined />,
        element: <PODetails />,
        isSidebarActive: false,
      },
      {
        path: "/po/add",
        name: "Add Purchase Order",
        icon: <FileDoneOutlined />,
        isSidebarActive: false,
        element: <AddPurchaseOrder />,
      },
      {
        path: "/po/:id/edit",
        name: "Edit Purchase Order",
        icon: <FileDoneOutlined />,
        isSidebarActive: false,
        element: <AddPurchaseOrder />,
      },
      {
        path: "/signature/list",
        name: "Signature",
        icon: <FileDoneOutlined />,
        isSidebarActive: true,
        element: <SignatureWrapper />,
      },
      {
        path: "/brands/list",
        name: "Brands",
        icon: <TrademarkOutlined />,
        isSidebarActive: false,
        element: <Brands />,
      },
      {
        path: "/inventory/product/add",
        name: "Create Product",
        icon: <AppstoreOutlined />,
        isSidebarActive: false,
        element: <CreateProduct />,
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
      },
      {
        path: "/products/brand/:id",
        name: "Products",
        icon: <AppstoreOutlined />,
        element: <ProductList />,
        isSidebarActive: false,
      },
      {
        path: "/brand-parent-categories/:bpcId",
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
      },
      {
        path: "/order/:id/edit",
        name: "Edit Order",
        icon: <DashboardOutlined />,
        isSidebarActive: false,
        element: <AddNewOrder />,
      },
      {
        path: "/invoices/list",
        name: "Invoices",
        icon: <FileTextOutlined />,
        isSidebarActive: false,
      },
      {
        path: "/invoice/:invoiceId",
        name: "Invoices",
        icon: <FileTextOutlined />,
        element: <InvoiceDetails />,
        isSidebarActive: false,
      },
      {
        path: "/quotations/:id",
        name: "Quotations Details",
        icon: <TagOutlined />,
        isSidebarActive: false,
        element: <QuotationsDetails />,
      },
      {
        path: "/quotations/add",
        name: "Add Quotations",
        icon: <TagOutlined />,
        element: <AddQuotation />,
        isSidebarActive: false,
      },
      {
        path: "/quotations/:id/edit",
        name: "Edit Quotations",
        icon: <TagOutlined />,
        element: <AddQuotation />,
        isSidebarActive: false,
      },
      {
        path: "/roles-permission/permissions/:id",
        name: "Permission Details",
        icon: <UserOutlined />,
        isSidebarActive: false,
        element: <Permissions />,
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
        path: "/u/:id/attendance",
        name: "HRMS",
        icon: <TeamOutlined />,
        isSidebarActive: false,
        element: <AttendanceWrapper />,
      },
      {
        path: "/no-access",
        name: "No Access",
        icon: <UserSwitchOutlined />,
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
    ],
  },
  {
    path: "/email",
    name: "Email",
    icon: <FileTextOutlined />,
    element: <EmailInterface />,
    isSidebarActive: false,
  },
  {
    path: "/inventory/categories-keywords",
    element: <CategoryManagement />,
    name: "Categories",
    icon: <ApartmentOutlined />,
    isSidebarActive: false,
  },
  {
    path: "/contact",
    element: <ContactWrapper />,
    name: "Contact",
    icon: <DollarOutlined />,
    isSidebarActive: false,
  },
  {
    path: "/customers/add",
    element: <AddCustomer />,
    name: "Add Customer",
    icon: <ShoppingCartOutlined />,
    isSidebarActive: false,
  },
  {
    path: "/customers/edit/:customerId",
    element: <AddCustomer />,
    name: "Edit Customer",
    icon: <ShoppingCartOutlined />,
    isSidebarActive: false,
  },
];

export default masterRoutes;
