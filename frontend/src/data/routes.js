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
import { PiAddressBook, PiUserListBold } from "react-icons/pi";
import { LiaFileInvoiceSolid, LiaFileSignatureSolid } from "react-icons/lia";
import OrderWrapper from "../components/Orders/OrderWrapper";
import {
  MdOutlineBrandingWatermark,
  MdError,
  MdBrandingWatermark,
  MdOutlineSettings,
} from "react-icons/md";
import { AiOutlineProduct } from "react-icons/ai";
import {
  BiAccessibility,
  BiCart,
  BiSearch,
  BiSolidCategory,
  BiUserCheck,
} from "react-icons/bi";
import { FaFileCircleCheck, FaFirstOrder, FaPooStorm } from "react-icons/fa6";
import { FaRegFile, FaTeamspeak, FaFileInvoice, FaQuora } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { IoLogOut, IoLogIn } from "react-icons/io5";
import Profile from "../components/Profile/Profile";
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
import QuotaionDetails from "../components/Quotation/QuotaionDetails";
import ProductDetails from "../components/Product/ProductDetails";
import UserList from "../components/User/UserList";
import GeneralSettings from "../components/Settings/GeneralSettings";
import UnderMaintanance from "../components/Error/UnderMaintanance";
import ComingSoon from "../components/Error/ComingSoon";
import AddQuntation from "../components/Quotation/AddQuntation";
import { GiCorporal } from "react-icons/gi";
import CmList from "../components/CMTrading/cmList";
import TeamsList from "../components/Orders/TeamsList";
import InvoiceDetails from "../components/Invoices/InvoiceDetails";
import OrderWithInvoice from "../components/Orders/OrderWithInvoice";
import CheckProductCodeStatus from "../components/Product/CheckProductCodeStatus";
import NoAccess from "../components/Common/NoAccess";
import RecentQuotation from "../components/Quotation/RecentQuotations";
import POSWrapperNew from "../components/POS-NEW/POSWrapper";
import AddressList from "../components/Address/Address";
import SearchList from "../components/Search/SearchList";
import AttendanceWrapper from "../components/Attendance/AttendanceWrapper";
import AttendanceList from "../components/Attendance/AttendanceList";
import NewAddUser from "../components/User/NewAddUser";
import UserPage from "../components/User/UserPage";
import { RiDashboardLine } from "react-icons/ri";
import { BsPeople } from "react-icons/bs";
import { MdOutlineInventory2 } from "react-icons/md";
import { MdOutlineDiscount } from "react-icons/md";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { TiBusinessCard } from "react-icons/ti";
import NewProductWrapper from "../components/Product/NewProductWrapper";
import Cart from "../components/POS-NEW/Cart";
import CompaniesWrapper from "../components/Companies/ComapniesWrapper";
import Product from "../components/Product/Product";
import ProductWrapper from "../components/Product/ProductWrapper";
import NewProductDetails from "../components/Product/NewProductDetails";
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
    path: "#",
    name: "Inventory",
    icon: <MdOutlineInventory2 />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/inventory/products",
        name: "Products",
        icon: <AiOutlineProduct />,
        element: <ProductList />,
        isSidebarActive: true,
      },
      {
        path: "/inventory/product/product-code-status",
        name: "Code Status",
        icon: <AiOutlineProduct />,
        element: <CheckProductCodeStatus />,
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
        path: "/brands/list",
        name: "List of Brands",
        icon: <MdOutlineBrandingWatermark />,
        isSidebarActive: true,
        element: <Brands />,
      },
      {
        path: "/inventory/product/add",
        name: "Create Product",
        icon: <AiOutlineProduct />,
        isSidebarActive: true,
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
        path: "/product/:id/edit",
        name: "Product Edit",
        icon: <AiOutlineProduct />,
        isSidebarActive: false,
        element: <CreateProduct />,
      },
    ],
  },
  {
    path: "#",
    name: "Orders",
    icon: <MdOutlineDiscount />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/orders/list",
        name: "Orders",
        icon: <FaFirstOrder />,
        isSidebarActive: true,
        element: <OrderWrapper />,
      },
      {
        path: "/order/:id",
        name: "Order Details",
        icon: <FaFirstOrder />,
        isSidebarActive: false,
        element: <OrderWithInvoice />,
      },
      {
        path: "/invoices/list",
        name: "List of Invoices",
        icon: <FaFileInvoice />,
        element: <RecentInvoices />,
        isSidebarActive: true,
      },
      {
        path: "/invoice/:invoiceId",
        name: "Invoices",
        icon: <FaFileInvoice />,
        element: <InvoiceDetails />,
        isSidebarActive: false,
      },
      {
        path: "/pos",
        name: "POS",
        icon: <FaPooStorm />,
        isSidebarActive: true,
        element: <POSWrapperNew />,
      },
      {
        path: "/pos-new",
        name: "POS NEW",
        icon: <FaPooStorm />,
        isSidebarActive: false,
        element: <POSWrapperNew />,
      },
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
        isSidebarActive: false,
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
        isSidebarActive: false,
      },
    ],
  },

  {
    path: "#",
    name: "Customers",
    icon: <BsPeople />,
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
        icon: <MdBrandingWatermark />,
        isSidebarActive: true,
        element: <ComapniesWrapper />,
      },
      {
        path: "/signature/list",
        name: "Signature",
        icon: <LiaFileSignatureSolid />,
        isSidebarActive: true,
        element: <SignatureWrapper />,
      },
      {
        path: "/orders/teams",
        name: "Teams",
        icon: <FaTeamspeak />,
        element: <TeamsList />,
        isSidebarActive: true,
      },
      {
        path: "/companies/list",
        name: "Companies",
        icon: <GiCorporal />,
        isSidebarActive: true,
        element: <CmList />,
      },
    ],
  },
  {
    path: "#",
    name: "Products",
    icon: <AiOutlineProduct />,
    element: <NewProductWrapper />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/inventory/list",
        name: "Products",
        icon: <AiOutlineProduct />,
        element: <NewProductWrapper />,
        isSidebarActive: true,
      },
      {
        path: "/inventory/list/:id",
        name: "Catregory filtered Products",
        icon: <AiOutlineProduct />,
        element: <ProductWrapper />,
        isSidebarActive: true,
      },
      {
        path: "/inventory/all-products/",
        name: "Products",
        icon: <AiOutlineProduct />,
        element: <Product />,
        isSidebarActive: true,
      },
      {
        path: "/inventory/new-product/:id",
        name: "Products",
        icon: <AiOutlineProduct />,
        element: <NewProductDetails />,
        isSidebarActive: true,
      },
    ],
  },

  {
    path: "/settings",
    name: "Settings",
    icon: <MdOutlineSettings />,
    isSidebarActive: true,
    element: <GeneralSettings />,
  },
  {
    path: "#",
    name: "HRM",
    // icon: <img src={hrmicon} />,
    icon: <MdOutlinePeopleAlt />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/hrm/attendance",
        name: "Attendance",
        icon: <MdOutlinePeopleAlt />,
        isSidebarActive: true,
        element: <AttendanceWrapper />,
      },
      {
        path: "/hrm/attendance/list",
        name: "Attendance List",
        icon: <MdOutlinePeopleAlt />,
        isSidebarActive: true,
        element: <AttendanceList />,
      },
      {
        path: "/users/list",
        name: "Users",
        icon: <BiUserCheck />,
        isSidebarActive: true,
        element: <UserList />,
      },
      {
        path: "/user/add",
        name: "User Add",
        icon: <BiUserCheck />,
        isSidebarActive: true,
        element: <NewAddUser />,
      },
      {
        path: "/user/:userId",
        name: "User Details",
        icon: <BiUserCheck />,
        isSidebarActive: false,
        element: <UserPage />,
      },
      {
        path: "/user/:userId/edit",
        name: "User Edit",
        icon: <BiUserCheck />,
        isSidebarActive: false,
        element: <NewAddUser />,
      },
    ],
  },
  {
    path: "#",
    name: "RBAC",
    icon: <TiBusinessCard />,
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
        path: "/roles-permission/permissions/:id",
        name: "Permission Details",
        icon: <MdPermIdentity />,
        isSidebarActive: false,
        element: <Permissions />,
      },
    ],
  },
  // {
  //   path: "#",
  //   name: "Latests",
  //   icon: <RiAdminLine />,
  //   isSidebarActive: true,
  //   submenu: [
  //     {
  //       path: "/recent/recent-orders",
  //       name: "Recent Orders",
  //       icon: <AiOutlineProduct />,
  //       element: <RecentOrders />,
  //       isSidebarActive: true,
  //     },
  //     {
  //       path: "/recent/invoices",
  //       name: "Recent Invoices",
  //       icon: <LiaFileInvoiceSolid />,
  //       isSidebarActive: true,
  //       element: <RecentInvoices />,
  //     },
  //     {
  //       path: "/recent/quotations",
  //       name: "Recent Quotations",
  //       icon: <FaQuora />,
  //       isSidebarActive: true,
  //       element: <RecentQuotation />,
  //     },
  //   ],
  // },
  {
    path: "/cart",
    name: "Cart",
    icon: <BiCart />,
    isSidebarActive: true,
    element: <Cart />,
  },
  {
    path: "#",
    name: "Others",
    icon: <FaFileCircleCheck />,
    isSidebarActive: false,
    submenu: [
      {
        path: "/search",
        name: "Search",
        icon: <BiSearch />,
        isSidebarActive: false,
        element: <SearchList />,
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
        path: "/forgot-password",
        name: "Forgot Password",
        icon: <MdError />,
        isSidebarActive: false,
        element: <ForgotPassword />,
      },
      {
        path: "/reset-password",
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
        path: "/under-maintainance",
        name: "Under Maintance",
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
];

export default masterRoutes;
