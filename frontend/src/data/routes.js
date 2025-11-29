import { PiUserList } from "react-icons/pi";
import { LiaFileSignatureSolid } from "react-icons/lia";
import { MdError, MdOutlineSettings } from "react-icons/md";
import { AiOutlineProduct } from "react-icons/ai";
import {
  BiAccessibility,
  BiCart,
  BiCategory,
  BiUser,
  BiCoinStack,
  BiNotification,
  BiTask,
} from "react-icons/bi";
import { FaFileCircleCheck } from "react-icons/fa6";
import { FaTeamspeak } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { IoDocumentAttach, IoLogIn } from "react-icons/io5";
import { MdOutlinePerson } from "react-icons/md";
import { RiDashboardLine, RiListOrdered } from "react-icons/ri";
import {
  MdOutlineInventory2,
  MdOutlineDiscount,
  MdOutlinePeopleAlt,
} from "react-icons/md";
import { TiBusinessCard } from "react-icons/ti";
import { IoPricetagOutline } from "react-icons/io5";
import { RiFileListLine } from "react-icons/ri";
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
const masterRoutes = [
  {
    path: "/",
    name: "Dashboard",
    icon: <RiDashboardLine />,
    isSidebarActive: true,
    element: <PageWrapper />,
    submenu: [],
  },
  {
    path: "/category-selector",
    name: "Products",
    element: <Product />,
    icon: <MdOutlineInventory2 />,
    isSidebarActive: true,
  },
  {
    path: "/orders/list",
    name: "Orders",
    icon: <MdOutlineDiscount />,
    element: <OrderWrapper />,
    isSidebarActive: true,
  },
  {
    path: "/quotations/list",
    name: "Quotations",
    icon: <IoDocumentAttach />,
    element: <QuotationList />,
    isSidebarActive: true,
  },
  {
    path: "/po/list",
    name: "Purchase Orders",
    icon: <RiListOrdered />,
    element: <POWrapper />,
    isSidebarActive: true,
  },
  {
    path: "/customers/list",
    name: "Customers",
    icon: <MdOutlinePeopleAlt />,
    isSidebarActive: true,
    element: <CustomerList />,
  },

  {
    path: "/tasks",
    name: "Tasks",
    icon: <BiTask />,
    isSidebarActive: false,
    element: <TaskWrapper />,
  },
  {
    path: "/inventory/list",
    name: "Inventory",
    icon: <BiCoinStack />,
    isSidebarActive: true,
    element: <InventoryWrapper />,
  },
  {
    path: "/cart",
    name: "Cart",
    icon: <BiCart />,
    isSidebarActive: false,
    element: <NewCart />,
  },
  {
    path: "#",
    name: "Master Table",
    icon: <BiCoinStack />,
    isSidebarActive: true,

    submenu: [
      {
        path: "/users/list",
        name: "Users",
        icon: <BiUser />,
        isSidebarActive: true,
        element: <UserList />,
      },
      {
        path: "/orders/teams",
        name: "Teams",
        icon: <FaTeamspeak />,
        element: <TeamsList />,
        isSidebarActive: true,
      },
      {
        path: "/user/add",
        name: "Create User",
        icon: <BiUser />,
        isSidebarActive: false,
        element: <NewAddUser />,
      },
      {
        path: "/user/:userId",
        name: "User Details",
        icon: <BiUser />,
        isSidebarActive: false,
        element: <UserPage />,
      },
      {
        path: "/user/:userId/edit",
        name: "Edit User",
        icon: <BiUser />,
        isSidebarActive: false,
        element: <NewAddUser />,
      },
      {
        path: "/roles-permission/list",
        name: "Roles",
        icon: <TiBusinessCard />,
        element: <RolePermission />,
        isSidebarActive: true,
      },

      {
        path: "/inventory/categories-keywords",
        element: <CategoryManagement />,
        name: "Categories",
        icon: <BiCategory />,
        isSidebarActive: true,
      },
    ],
  },
  {
    path: "#",
    name: "Others",
    icon: <FaFileCircleCheck />,
    isSidebarActive: false,
    submenu: [
      {
        path: "/settings",
        name: "Settings",
        icon: <MdOutlineSettings />,
        isSidebarActive: false,
        element: <GeneralSettings />,
      },

      {
        path: "/customer/:id",
        name: "Customer Details",
        icon: <PiUserList />,
        isSidebarActive: false,
        element: <CustomerDetails />,
      },

      {
        path: "/po/:id",
        name: "PO Details",
        icon: <LiaFileSignatureSolid />,
        element: <PODetails />,
        isSidebarActive: false,
      },
      {
        path: "/po/add",
        name: "Add Purchase Order",
        icon: <LiaFileSignatureSolid />,
        isSidebarActive: false,
        element: <AddPurchaseOrder />,
        requiredPermission: { api: "write", module: "purchase_orders" },
      },
      {
        path: "/po/:id/edit",
        name: "Edit Purchase Order",
        icon: <LiaFileSignatureSolid />,
        isSidebarActive: false,
        element: <AddPurchaseOrder />,
        requiredPermission: { api: "edit", module: "purchase_orders" },
      },

      {
        path: "/product/add",
        name: "Create Product",
        icon: <AiOutlineProduct />,
        isSidebarActive: false,
        element: <CreateProduct />,
        requiredPermission: { api: "write", module: "products" },
      },
      {
        path: "/product/:id",
        name: "Product Details",
        icon: <AiOutlineProduct />,
        isSidebarActive: false,
        element: <ProductDetails />,
      },
      {
        path: "/product/:productId/edit",
        name: "Edit Product",
        icon: <AiOutlineProduct />,
        isSidebarActive: false,
        element: <CreateProduct />,
        requiredPermission: { api: "edit", module: "products" },
      },
      {
        path: "/store/:id",
        name: "Products",
        icon: <AiOutlineProduct />,
        element: <ProductList />,
        isSidebarActive: false,
      },
      {
        path: "/category-selector/:bpcId",
        name: "Products",
        icon: <AiOutlineProduct />,
        element: <BrandSelection />,
        isSidebarActive: false,
      },
      {
        path: "/order/:id",
        name: "Order Details",
        icon: <RiFileListLine />,
        isSidebarActive: false,
        element: <OrderPage />,
      },
      {
        path: "/order/add",
        name: "Add Order",
        icon: <RiFileListLine />,
        isSidebarActive: false,
        element: <AddNewOrder />,
        requiredPermission: { api: "write", module: "orders" },
      },
      {
        path: "/order/:id/edit",
        name: "Edit Order",
        icon: <RiDashboardLine />,
        isSidebarActive: false,
        element: <AddNewOrder />,
        requiredPermission: { api: "edit", module: "orders" },
      },

      {
        path: "/quotation/:id",
        name: "Quotations Details",
        icon: <IoPricetagOutline />,
        isSidebarActive: false,
        element: <NewQuotationsDetails />,
        requiredPermission: { api: "view", module: "quotations" },
      },
      {
        path: "/quotation/add",
        name: "Add Quotations",
        icon: <IoPricetagOutline />,
        element: <AddQuotation />,
        isSidebarActive: false,
        requiredPermission: { api: "write", module: "quotations" },
      },
      {
        path: "/quotation/:id/view",
        name: "View Quotations",
        icon: <IoPricetagOutline />,
        element: <QuotationsDetails />,
        isSidebarActive: false,
      },
      {
        path: "/quotation/:id/edit",
        name: "Edit Quotations",
        icon: <IoPricetagOutline />,
        element: <AddQuotation />,
        isSidebarActive: false,
        requiredPermission: { api: "edit", module: "quotations" },
      },
      {
        path: "/roles-permission/permissions/:id",
        name: "Grant Permissions",
        icon: <MdOutlinePerson />,
        isSidebarActive: false,
        element: <Permissions />,
        requiredPermission: { api: "view", module: "rolepermissions" },
      },
      {
        path: "/u/:id/edit",
        name: "Edit Profile",
        icon: <CgProfile />,
        isSidebarActive: false,
        element: <ProfileForm />,
      },
      {
        path: "/u/:id",
        name: "Profile",
        icon: <CgProfile />,
        isSidebarActive: false,
        element: <Profile />,
      },
      {
        path: "/verify-account",
        name: "Veriy Account",
        icon: <IoLogIn />,
        isSidebarActive: false,
        element: <EmailVerification />,
      },
      {
        path: "/login",
        name: "login",
        icon: <IoLogIn />,
        isSidebarActive: false,
        element: <Login />,
      },

      {
        path: "/no-access",
        name: "No Access",
        icon: <BiAccessibility />,
        isSidebarActive: false,
        element: <NoAccess />,
      },
      {
        path: "/signup",
        name: "Signup",
        icon: <IoLogIn />,
        isSidebarActive: false,
        element: <Signup />,
      },
      {
        path: "/404",
        name: "Error",
        icon: <MdError />,
        isSidebarActive: false,
        element: <Error404 />,
      },
      {
        path: "/403",
        name: "Error",
        icon: <MdError />,
        isSidebarActive: false,
        element: <Error403 />,
      },
      {
        path: "/forgot-password",
        name: "Forgot Password",
        icon: <MdError />,
        isSidebarActive: false,
        element: <ForgotPassword />,
      },
      {
        path: "/reset-password/:token",
        name: "Reset Password",
        icon: <MdError />,
        isSidebarActive: false,
        element: <ResetPassword />,
      },
      {
        path: "/500",
        name: "ERROR 500",
        icon: <MdError />,
        isSidebarActive: false,
        element: <Error500 />,
      },
      {
        path: "/under-maintenance",
        name: "Under Maintenance",
        icon: <MdError />,
        isSidebarActive: false,
        element: <UnderMaintanance />,
      },
      {
        path: "/coming-soon",
        name: "Coming Soon",
        icon: <MdError />,
        isSidebarActive: false,
        element: <ComingSoon />,
      },
      {
        path: "/customer/add",
        element: <AddCustomer />,
        name: "Add Customer",
        icon: <BiCart />,
        isSidebarActive: false,
        requiredPermission: { api: "write", module: "customers" },
      },
      {
        path: "/customer/edit/:customerId",
        element: <AddCustomer />,
        name: "Edit Customer",
        icon: <BiCart />,
        isSidebarActive: false,
        requiredPermission: { api: "edit", module: "customers" },
      },
      {
        path: "/notifications",
        name: "Notifications",
        icon: <BiNotification />,
        isSidebarActive: false,
        element: <NotificationsWrapper />,
      },
    ],
  },
  {
    path: "/logging",
    name: "Logs",
    icon: <IoDocumentAttach />,
    element: <LogTable />,
    isSidebarActive: false,
  },
];

export default masterRoutes;
