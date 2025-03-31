import ForgotPassword from "../components/Auth/ForgotPassword";
import Login from "../components/Auth/Login";
import Signup from "../components/Auth/Signup";
import CategoriesList from "../components/Categories/CategoriesList";
import Error404 from "../components/Error/Error404";
import PageWrapper from "../components/Home/PageWrapper";
import ComapniesWrapper from "../components/Companies/ComapniesWrapper";
import ProductList from "../components/Product/ProductList";
import CustomerList from "../components/Customers/CustomerList";
import CustomerDetails from "../components/Customers/CustomerDetails";
import SignatureWrapper from "../components/Signature/SignatureWrapper";
import { RiAdminLine } from "react-icons/ri";
import { LuUsersRound } from "react-icons/lu";
import { PiSignatureDuotone, PiUserListBold } from "react-icons/pi";
import { LiaFileInvoiceSolid, LiaFileSignatureSolid } from "react-icons/lia";
import OrderWrapper from "../components/POS/OrderWrapper";
import OrderDetails from "../components/POS/OrderDetail";
import {
  MdOutlineBrandingWatermark,
  MdOutlineBorderColor,
  MdError,
  MdInventory,
  MdBrandingWatermark,
  MdOutlineSettings,
} from "react-icons/md";
import { AiFillSecurityScan, AiOutlineProduct } from "react-icons/ai";
import { BiSolidCategory, BiUserCheck } from "react-icons/bi";
import { FaFileCircleCheck, FaFirstOrder, FaPooStorm } from "react-icons/fa6";
import {
  FaRegFile,
  FaJediOrder,
  FaFirstOrderAlt,
  FaUserGraduate,
} from "react-icons/fa";
import { AiTwotoneCreditCard, AiFillProfile } from "react-icons/ai";
import { CgProfile } from "react-icons/cg";
import { IoLogOut, IoLogIn, IoHome } from "react-icons/io5";
import Profile from "../components/Profile/Profile";
import POSWrapper from "../components/POS/POSWrapper";
import CreateProduct from "../components/Product/CreateProduct";
import RecentOrders from "../components/Orders/RecentOrders";
import ResetPassword from "../components/Auth/ResetPassword";
import QuotationList from "../components/Quotation/QuotationList";
import RecentInvoices from "../components/Invoices/RecentInvoices";
import { MdPermIdentity } from "react-icons/md";
import RolePermission from "../components/RolesPermission/RolePermission";
import Permissions from "../components/RolesPermission/Permissions";
import Error500 from "../components/Error/Error500";
import Brands from "../components/Brands/Brands";
import GivePermission from "../components/RolesPermission/GivePermissions";
import QuotaionDetails from "../components/Quotation/QuotaionDetails";
import ProductDetails from "../components/Product/ProductDetails";
import UserList from "../components/User/UserList";
import GeneralSettings from "../components/Settings/GeneralSettings";
import UnderMaintanance from "../components/Error/UnderMaintanance";
import ComingSoon from "../components/Error/ComingSoon";
import AddQuntation from "../components/Quotation/AddQuntation";
import { GiCorporal } from "react-icons/gi";
import CmList from "../components/CMTrading/cmList";
import SecuritySettings from "../components/Settings/SecuritySettings";
const masterRoutes = [
  {
    path: "/",
    name: "Dashboard",
    icon: <IoHome />,
    isSidebarActive: true,
    element: <PageWrapper />,
    submenu: [],
  },
  {
    path: "#",
    name: "Super Admin",
    icon: <RiAdminLine />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/super-admin/customers",
        name: "Customers",
        icon: <LuUsersRound />,
        isSidebarActive: true,
        element: <CustomerList />,
      },
      {
        path: "/super-admin/users",
        name: "Users",
        icon: <BiUserCheck />,
        isSidebarActive: true,
        element: <UserList />,
      },
      {
        path: "/super-admin/companies",
        name: "Companies",
        icon: <GiCorporal />,
        isSidebarActive: true,
        element: <CmList />,
      },
      {
        path: "/super-admin/recent-orders",
        name: "Recent Orders",
        icon: <FaFirstOrderAlt />,
        element: <RecentOrders />,
        isSidebarActive: true,
      },
      {
        path: "/super-admin/invoices",
        name: "Recent Invoices",
        icon: <LiaFileInvoiceSolid />,
        isSidebarActive: true,
        element: <RecentInvoices />,
      },
      {
        path: "/super-admin/permissions",
        name: "Permission To Give",
        icon: <MdOutlineBorderColor />,
        isSidebarActive: true,
        element: <GivePermission />,
      },
    ],
  },
  {
    path: "#",
    name: "Managerials",
    icon: <FaUserGraduate />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/customers/list",
        name: "Customers",
        icon: <PiUserListBold />,
        isSidebarActive: true,
        element: <CustomerList />,
      },
      {
        path: "/customer/:id",
        name: "Customer Details",
        icon: <PiUserListBold />,
        isSidebarActive: true,
        element: <CustomerDetails />,
      },
      {
        path: "/vendors/list",
        name: "Vendors",
        icon: <MdBrandingWatermark />,
        isSidebarActive: true,
        element: <ComapniesWrapper />,
      },
      {
        path: "/brands/list",
        name: "Brands",
        icon: <MdOutlineBrandingWatermark />,
        isSidebarActive: true,
        element: <Brands />,
      },
      {
        path: "/signature/list",
        name: "Signature",
        icon: <LiaFileSignatureSolid />,
        isSidebarActive: true,
        element: <SignatureWrapper />,
      },
      {
        path: "/signature/:id",
        name: "Signature Details",
        icon: <LiaFileSignatureSolid />,
        isSidebarActive: true,
      },
      {
        path: "/signature/:id/edit",
        name: "Signature Edit",
        icon: <LiaFileSignatureSolid />,
        isSidebarActive: true,
      },
      {
        path: "/signature/add",
        name: "Signature Add",
        icon: <LiaFileSignatureSolid />,
        isSidebarActive: true,
      },
    ],
  },
  {
    path: "/#",
    name: "Inventory",
    icon: <MdInventory />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/inventory/list",
        name: "Inventory",
        icon: <AiOutlineProduct />,
        element: <ProductList />,
        isSidebarActive: true,
      },

      {
        path: "/inventory/categories-keywords",
        element: <CategoriesList />,
        name: "Categories & Keywords",
        icon: <BiSolidCategory />,
        isSidebarActive: true,
      },
      {
        path: "/inventory/product/add",
        name: "Products Add",
        icon: <AiOutlineProduct />,
        isSidebarActive: true,
        element: <CreateProduct />,
      },
      {
        path: "/product/:id",
        name: "Product Details",
        icon: <AiOutlineProduct />,
        isSidebarActive: true,
        element: <ProductDetails />,
      },
      {
        path: "/product/:id/edit",
        name: "Product Edit",
        icon: <AiOutlineProduct />,
        isSidebarActive: true,
        element: <CreateProduct />,
      },
    ],
  },

  {
    path: "/pos",
    name: "POS",
    icon: <FaPooStorm />,
    isSidebarActive: true,
    element: <POSWrapper />,
  },
  {
    path: "/orders/list",
    name: "Orders",
    icon: <FaFirstOrder />,
    isSidebarActive: true,
    element: <OrderWrapper />,
  },
  {
    path: "/orders/:id",
    name: "Order Details",
    icon: <FaFirstOrder />,
    isSidebarActive: true,
    element: <OrderDetails />,
  },
  {
    path: "#",
    name: "Quotations",
    icon: <FaFileCircleCheck />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/quotations/list",
        name: "Quotations List",
        icon: <FaRegFile />,
        isSidebarActive: true,
        element: <QuotationList />,
      },
      {
        path: "/quotations/:id",
        name: "Quotations Details",
        icon: <FaRegFile />,
        isSidebarActive: true,
        element: <QuotaionDetails />,
      },
      {
        path: "/quotations/add",
        name: "Add Quotations",
        icon: <FaRegFile />,
        element: <AddQuntation />,
        isSidebarActive: true,
      },
      {
        path: "/quotations/:id/edit",
        name: "Edit Quotations",
        icon: <FaRegFile />,
        element: <AddQuntation />,
        isSidebarActive: true,
      },
    ],
  },
  {
    path: "/roles-permissions",
    name: "Roles & Permission",
    icon: <MdPermIdentity />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/roles-permission/list",
        name: "Roles Permission List",
        icon: <MdPermIdentity />,
        isSidebarActive: true,
        element: <RolePermission />,
      },
      {
        path: "roles-permission/permissions/:id",
        name: "Permission Details",
        icon: <MdPermIdentity />,
        isSidebarActive: true,
        element: <Permissions />,
      },
    ],
  },

  {
    path: "/settings/general",
    name: "Settings",
    icon: <MdOutlineSettings />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/settings/general",
        name: "General Settings",
        icon: <MdOutlineSettings />,
        isSidebarActive: true,
        element: <GeneralSettings />,
      },
      {
        path: "/settings/profile",
        name: "Profile Settings",
        icon: <AiFillProfile />,
        isSidebarActive: true,
      },
      {
        path: "/settings/security",
        name: "Secure Settings",
        icon: <AiFillSecurityScan />,
        element: <SecuritySettings />,
      },
    ],
  },
  {
    path: "/u/:id",
    name: "Profile",
    icon: <CgProfile />,
    isSidebarActive: true,
    element: <Profile />,
  },
  {
    path: "#",
    name: "Logout",
    icon: <IoLogOut />,
    isSidebarActive: true,
  },
  {
    path: "/login",
    name: "login",
    icon: <IoLogIn />,
    isSidebarActive: true,
    element: <Login />,
  },
  {
    path: "/signup",
    name: "Signup",
    icon: <IoLogIn />,
    isSidebarActive: true,
    element: <Signup />,
  },
  {
    path: "/404",
    name: "Error",
    icon: <MdError />,
    isSidebarActive: true,
    element: <Error404 />,
  },
  {
    path: "/forgot-password",
    name: "Forgot Password",
    icon: <MdError />,
    isSidebarActive: true,
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    name: "Reset Password",
    icon: <MdError />,
    isSidebarActive: true,
    element: <ResetPassword />,
  },
  {
    path: "/500",
    name: "ERROR 500",
    icon: <MdError />,
    isSidebarActive: true,
    element: <Error500 />,
  },
  {
    path: "/under-maintainance",
    name: "Under Maintance",
    icon: <MdError />,
    isSidebarActive: true,
    element: <UnderMaintanance />,
  },
  {
    path: "/coming-soon",
    name: "Coming Soon",
    icon: <MdError />,
    isSidebarActive: true,
    element: <ComingSoon />,
  },
];

export default masterRoutes;
