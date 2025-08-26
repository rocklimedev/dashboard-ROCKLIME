import { PiAddressBook, PiUserList } from "react-icons/pi";
import { LiaFileSignatureSolid } from "react-icons/lia";
import {
  MdOutlineBrandingWatermark,
  MdError,
  MdOutlineSettings,
} from "react-icons/md";
import { AiOutlineProduct } from "react-icons/ai";
import {
  BiAccessibility,
  BiCart,
  BiCategory,
  BiUser,
  BiCoinStack,
} from "react-icons/bi";
import { FaFileCircleCheck } from "react-icons/fa6";
import { FaTeamspeak } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { IoLogOut, IoLogIn } from "react-icons/io5";
import { GiSuitcase } from "react-icons/gi";
import { MdOutlinePerson } from "react-icons/md";
import { RiDashboardLine } from "react-icons/ri";
import {
  MdOutlineInventory2,
  MdOutlineDiscount,
  MdOutlinePeopleAlt,
} from "react-icons/md";
import { TiBusinessCard } from "react-icons/ti";
import { PiMicrosoftTeamsLogoLight } from "react-icons/pi";
import { IoPricetagOutline } from "react-icons/io5";
import { FaFileInvoice } from "react-icons/fa6";
import { RiFileListLine } from "react-icons/ri";
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
import CmList from "../components/CMTrading/cmList";
import TeamsList from "../components/Orders/TeamsList";
import InvoiceDetails from "../components/Invoices/InvoiceDetails";
import CheckProductCodeStatus from "../components/Product/CheckProductCodeStatus";
import NoAccess from "../components/Common/NoAccess";
import AddressList from "../components/Address/Address";
import AttendanceWrapper from "../components/Attendance/AttendanceWrapper";
import AttendanceList from "../components/Attendance/AttendanceList";
import NewAddUser from "../components/User/NewAddUser";
import UserPage from "../components/User/UserPage";
import Product from "../components/Product/Product";
import AddQuotation from "../components/Quotation/AddQuntation";
import CompaniesWrapper from "../components/Companies/ComapniesWrapper";
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
    path: "/inventory/products",
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
    // submenu: [
    //   {
    //     path: "/orders/list",
    //     name: "Orders",
    //     icon: <RiFileListLine />,
    //     isSidebarActive: true,
    //     element: <OrderWrapper />,
    //   },
    // ],
  },
  {
    path: "/customers/list",
    name: "Customers",
    icon: <MdOutlinePeopleAlt />,
    isSidebarActive: true,
    element: <CustomerList />,
  },
  {
    path: "#",
    name: "Products",
    icon: <AiOutlineProduct />,

    isSidebarActive: false,
    submenu: [
      {
        path: "/inventory/list",
        name: "Products",
        icon: <AiOutlineProduct />,

        isSidebarActive: false,
      },

      {
        path: "/inventory/all-products/",
        name: "Products",
        icon: <AiOutlineProduct />,
        element: <Product />,
        isSidebarActive: false,
      },
    ],
  },
  {
    path: "/settings",
    name: "Settings",
    icon: <MdOutlineSettings />,
    isSidebarActive: false,
    element: <GeneralSettings />,
  },
  {
    path: "#",
    name: "Team",
    icon: <PiMicrosoftTeamsLogoLight />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/hrm/attendance/list",
        name: "HRM",
        icon: <MdOutlinePeopleAlt />,
        isSidebarActive: false,
        element: <AttendanceList />,
      },
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
        name: "User Edit",
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
    ],
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
    name: "Others",
    icon: <FaFileCircleCheck />,
    isSidebarActive: false,
    submenu: [
      {
        path: "/customers/list",
        name: "Customers",
        icon: <PiUserList />,
        isSidebarActive: true,
        element: <CustomerList />,
      },
      {
        path: "/customer/:id",
        name: "Customer Details",
        icon: <PiUserList />,
        isSidebarActive: false,
        element: <CustomerDetails />,
      },
      {
        path: "/address/list",
        name: "Address",
        icon: <PiAddressBook />,
        isSidebarActive: true,
        element: <AddressList />,
      },
      {
        path: "/vendors/list",
        name: "Vendors",
        icon: <MdOutlineBrandingWatermark />,
        isSidebarActive: true,
        element: <CompaniesWrapper />,
      },
      {
        path: "/signature/list",
        name: "Signature",
        icon: <LiaFileSignatureSolid />,
        isSidebarActive: true,
        element: <SignatureWrapper />,
      },
      {
        path: "/companies/list",
        name: "Companies",
        icon: <GiSuitcase />,
        isSidebarActive: true,
        element: <CmList />,
      },
      {
        path: "/brands/list",
        name: "Brands",
        icon: <MdOutlineBrandingWatermark />,
        isSidebarActive: false,
        element: <Brands />,
      },
      {
        path: "/inventory/product/add",
        name: "Create Product",
        icon: <AiOutlineProduct />,
        isSidebarActive: false,
        element: <CreateProduct />,
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
        name: "Product Edit",
        icon: <AiOutlineProduct />,
        isSidebarActive: false,
        element: <CreateProduct />,
      },
      {
        path: "/products/brand/:id",
        name: "Products",
        icon: <AiOutlineProduct />,
        element: <ProductList />,
        isSidebarActive: false,
      },
      {
        path: "/brand-parent-categories/:bpcId",
        name: "Products",
        icon: <AiOutlineProduct />,
        element: <BrandSelection />,
        isSidebarActive: false,
      },
      {
        path: "/inventory/products",
        name: "Products",
        icon: <AiOutlineProduct />,
        element: <Product />,
        isSidebarActive: true,
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
      },
      {
        path: "/order/:id/edit",
        icon: <RiDashboardLine />,
        isSidebarActive: false,
        element: <AddNewOrder />,
      },
      {
        path: "/invoices/list",
        name: "Invoices",
        icon: <FaFileInvoice />,
        isSidebarActive: false,
      },
      {
        path: "/invoice/:invoiceId",
        name: "Invoices",
        icon: <FaFileInvoice />,
        element: <InvoiceDetails />,
        isSidebarActive: false,
      },

      {
        path: "/quotations/list",
        name: "Quotations",
        icon: <IoPricetagOutline />,
        isSidebarActive: false,
        element: <QuotationList />,
      },
      {
        path: "/quotations/:id",
        name: "Quotations Details",
        icon: <IoPricetagOutline />,
        isSidebarActive: false,
        element: <QuotationsDetails />,
      },
      {
        path: "/quotations/add",
        name: "Add Quotations",
        icon: <IoPricetagOutline />,
        element: <AddQuotation />,
        isSidebarActive: false,
      },
      {
        path: "/quotations/:id/edit",
        name: "Edit Quotations",
        icon: <IoPricetagOutline />,
        element: <AddQuotation />,
        isSidebarActive: false,
      },
      {
        path: "/roles-permission/permissions/:id",
        name: "Permission Details",
        icon: <MdOutlinePerson />,
        isSidebarActive: false,
        element: <Permissions />,
      },

      {
        path: "/u/:id",
        name: "Profile",
        icon: <CgProfile />,
        isSidebarActive: false,
        element: <Profile />,
      },
      {
        path: "#",
        name: "Logout",
        icon: <IoLogOut />,
        isSidebarActive: true,
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
        path: "/u/:id/attendance",
        name: "HRMS",
        icon: <MdOutlinePeopleAlt />,
        isSidebarActive: false,
        element: <AttendanceWrapper />,
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
    ],
  },
  {
    path: "/email",
    name: "Email",
    icon: <RiFileListLine />,
    element: <EmailInterface />,
    isSidebarActive: false,
  },
  {
    path: "/inventory/product/product-code-status",
    name: "Code Status",
    icon: <RiFileListLine />,
    element: <CheckProductCodeStatus />,
    isSidebarActive: false,
  },
  {
    path: "/inventory/categories-keywords",
    element: <CategoryManagement />,
    name: "Categories",
    icon: <BiCategory />,
    isSidebarActive: false,
  },
  {
    path: "/contact",
    element: <ContactWrapper />,
    name: "Contact",
    icon: <BiCoinStack />,
    isSidebarActive: false,
  },
  {
    path: "/customers/add",
    element: <AddCustomer />,
    name: "Add Customer",
    icon: <BiCart />,
    isSidebarActive: false,
  },
  {
    path: "/customers/edit/:customerId",
    element: <AddCustomer />,
    name: "Edit Customer",
    icon: <BiCart />,
    isSidebarActive: false,
  },
];

export default masterRoutes;
