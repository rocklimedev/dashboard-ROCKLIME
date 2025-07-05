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
  BiSearch,
  BiCategory,
  BiUser,
} from "react-icons/bi";
import { FaFileCircleCheck } from "react-icons/fa6";
import { FaPhone } from "react-icons/fa";
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
import { TbShoppingCart } from "react-icons/tb";
import { IoPricetagOutline } from "react-icons/io5";
import { FaFileInvoice } from "react-icons/fa6";
import { RiFileListLine } from "react-icons/ri";
import { FaExternalLinkAlt } from "react-icons/fa";
import ForgotPassword from "../components/Auth/ForgotPassword";
import Login from "../components/Auth/Login";
import Signup from "../components/Auth/Signup";
import CategoriesList from "../components/Categories/CategoriesList";
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
import RecentInvoices from "../components/Invoices/RecentInvoices";
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
import OrderWithInvoice from "../components/Orders/OrderWithInvoice";
import CheckProductCodeStatus from "../components/Product/CheckProductCodeStatus";
import NoAccess from "../components/Common/NoAccess";
import POSWrapperNew from "../components/POS-NEW/POSWrapper";
import AddressList from "../components/Address/Address";
import SearchList from "../components/Search/SearchList";
import AttendanceWrapper from "../components/Attendance/AttendanceWrapper";
import AttendanceList from "../components/Attendance/AttendanceList";
import NewAddUser from "../components/User/NewAddUser";
import UserPage from "../components/User/UserPage";
import NewProductWrapper from "../components/Product/NewProductWrapper";
import Cart from "../components/POS-NEW/Cart";
import Product from "../components/Product/Product";
import ProductWrapper from "../components/Product/ProductWrapper";
import NewProductDetails from "../components/Product/NewProductDetails";
import ProductListByCategory from "../components/Product/ProductListByCategory";
import AddQuotation from "../components/Quotation/AddQuntation";
import CompaniesWrapper from "../components/Companies/ComapniesWrapper";
import QuotationsDetails from "../components/Quotation/QuotaionDetails";
import UnderMaintanance from "../components/Error/UnderMaintanance";
import AddNewOrder from "../components/Orders/AddNewOrder";
import NewUserList from "../components/User/NewUserList";

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
        icon: <RiFileListLine />,
        element: <CheckProductCodeStatus />,
        isSidebarActive: true,
      },
      {
        path: "/inventory/categories-keywords",
        element: <CategoriesList />,
        name: "Categories",
        icon: <BiCategory />,
        isSidebarActive: true,
      },
      {
        path: "/brands/list",
        name: "Brands",
        icon: <MdOutlineBrandingWatermark />,
        isSidebarActive: true,
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
        icon: <RiFileListLine />,
        isSidebarActive: true,
        element: <OrderWrapper />,
      },
      {
        path: "/order/:id",
        name: "Order Details",
        icon: <RiFileListLine />,
        isSidebarActive: false,
        element: <OrderWithInvoice />,
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
        icon: <TbShoppingCart />,
        isSidebarActive: false,
        element: <POSWrapperNew />,
      },
      {
        path: "/pos-new",
        name: "POS NEW",
        icon: <TbShoppingCart />,
        isSidebarActive: false,
        element: <POSWrapperNew />,
      },
      {
        path: "/quotations/list",
        name: "Quotations",
        icon: <IoPricetagOutline />,
        isSidebarActive: true,
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
    ],
  },
  {
    path: "#",
    name: "Customers",
    icon: <MdOutlinePeopleAlt />,
    isSidebarActive: true,
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
        path: "/orders/teams",
        name: "Teams",
        icon: <FaPhone />,
        element: <TeamsList />,
        isSidebarActive: true,
      },
      {
        path: "/companies/list",
        name: "Companies",
        icon: <GiSuitcase />,
        isSidebarActive: true,
        element: <CmList />,
      },
    ],
  },
  // {
  //   path: "#",
  //   name: "Products",
  //   icon: <AiOutlineProduct />,
  //   element: <NewProductWrapper />,
  //   isSidebarActive: true,
  //   submenu: [
  //     {
  //       path: "/inventory/list",
  //       name: "Products",
  //       icon: <AiOutlineProduct />,
  //       element: <NewProductWrapper />,
  //       isSidebarActive: true,
  //     },
  //     {
  //       path: "/products/:categoryId",
  //       name: "Category filtered Products",
  //       icon: <BiCategory />,
  //       element: <ProductListByCategory />,
  //       isSidebarActive: true,
  //     },
  //     {
  //       path: "/inventory/list/:id",
  //       name: "Category filtered Products",
  //       icon: <BiCategory />,
  //       element: <ProductWrapper />,
  //       isSidebarActive: true,
  //     },
  //     {
  //       path: "/inventory/all-products/",
  //       name: "Products",
  //       icon: <AiOutlineProduct />,
  //       element: <Product />,
  //       isSidebarActive: true,
  //     },
  //     {
  //       path: "/inventory/new-product/:id",
  //       name: "Products",
  //       icon: <AiOutlineProduct />,
  //       element: <NewProductDetails />,
  //       isSidebarActive: true,
  //     },
  //   ],
  // },
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
    icon: <MdOutlinePeopleAlt />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/hrm/attendance",
        name: "HRMS",
        icon: <MdOutlinePeopleAlt />,
        isSidebarActive: true,
        element: <AttendanceWrapper />,
      },
      {
        path: "/hrm/attendance/list",
        name: "Employee",
        icon: <MdOutlinePeopleAlt />,
        isSidebarActive: true,
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
        path: "/user/add",
        name: "Create User",
        icon: <BiUser />,
        isSidebarActive: true,
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
    ],
  },
  {
    path: "/roles-permission/list",
    name: "RBAC",
    icon: <TiBusinessCard />,
    element: <RolePermission />,
    isSidebarActive: true,
  },
  {
    path: "/cart",
    name: "Cart",
    icon: <BiCart />,
    isSidebarActive: false,
    element: <Cart />,
  },
  {
    path: "#",
    name: "Others",
    icon: <FaFileCircleCheck />,
    isSidebarActive: false,
    submenu: [
      {
        path: "/roles-permission/permissions/:id",
        name: "Permission Details",
        icon: <MdOutlinePerson />,
        isSidebarActive: false,
        element: <Permissions />,
      },
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
];

export default masterRoutes;
