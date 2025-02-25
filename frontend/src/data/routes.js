import ForgotPassword from "../components/Auth/ForgotPassword";
import Login from "../components/Auth/Login";
import Signup from "../components/Auth/Signup";
import CategoriesList from "../components/Categories/CategoriesList";
import Error404 from "../components/Error/Error404";
import PageWrapper from "../components/Home/PageWrapper";
import ComapniesWrapper from "../components/Companies/ComapniesWrapper";
import ProductList from "../components/Product/ProductList";
import InventoryWrapper from "../components/Inventory/InventoryWrapper";
import CategoriesItem from "../components/Categories/CategoriesItem";
import CustomerList from "../components/Customers/CustomerList";
import CustomerDetails from "../components/Customers/CustomerDetails";
import CustomerLedger from "../components/Customers/CustomerLedger";
import SignatureWrapper from "../components/Signature/SignatureWrapper";
import { RiAdminLine } from "react-icons/ri";
import { LuUsersRound } from "react-icons/lu";
import { PiSignatureDuotone, PiUserListBold } from "react-icons/pi";
import { LiaFileInvoiceSolid, LiaFileSignatureSolid } from "react-icons/lia";
import {
  MdOutlineBrandingWatermark,
  MdOutlineBorderColor,
  MdError,
  MdInventory,
  MdBrandingWatermark,
  MdOutlineSettings,
} from "react-icons/md";
import { AiOutlineProduct } from "react-icons/ai";
import { BiSolidCategory } from "react-icons/bi";
import { FaFileCircleCheck, FaPooStorm } from "react-icons/fa6";
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
        name: "Users",
        icon: <LuUsersRound />,
        isSidebarActive: true,
      },
      {
        path: "/super-admin/signatures",
        name: "Signatures",
        icon: <PiSignatureDuotone />,
        isSidebarActive: true,
      },
      {
        path: "/super-admin/orders",
        name: "Recent Orders",
        icon: <FaFirstOrderAlt />,
        isSidebarActive: true,
      },
      {
        path: "/super-admin/invoices",
        name: "Recent Invoices",
        icon: <LiaFileInvoiceSolid />,
        isSidebarActive: true,
      },
      {
        path: "/super-admin/permissions",
        name: "Permission To Give",
        icon: <MdOutlineBorderColor />,
        isSidebarActive: true,
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
      },
      {
        path: "/vendors/list",
        name: "Vendors",
        icon: <MdBrandingWatermark />,
        isSidebarActive: true,
      },
      {
        path: "/brands/list",
        name: "Brands",
        icon: <MdOutlineBrandingWatermark />,
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
        path: "/inventory/categories",
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
        element: <CreateProduct/>
      },
      {
        path: "/inventory/product/:id",
        name: "Product Details",
        icon: <ProductList />,
        isSidebarActive: false,
      },
      {
        path: "/inventory/product/:id/edit",
        name: "Product Edit",
        icon: <ProductList />,
        isSidebarActive: false,
      },
    ],
  },
  {
    path: "#",
    name: "Signature",
    icon: <PiSignatureDuotone />,
    isSidebarActive: true,
    submenu: [
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
        isSidebarActive: false,
      },
      {
        path: "/signature/:id/edit",
        name: "Signature Edit",
        icon: <LiaFileSignatureSolid />,
        isSidebarActive: false,
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
    path: "/pos",
    name: "POS",
    icon: <FaPooStorm/>,
    isSidebarActive: true,
    element: <POSWrapper/>
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
      },
      {
        path: "/quotations/:id",
        name: "Quotations Details",
        icon: <FaRegFile />,
        isSidebarActive: true,
      },
      {
        path: "/quotations/add",
        name: "Add Quotations",
        icon: <FaRegFile />,
        isSidebarActive: true,
      },
      {
        path: "/quotations/:id/edit",
        name: "Edit Quotations",
        icon: <FaRegFile />,
        isSidebarActive: false,
      },
    ],
  },
  {
    path: "/order",
    name: "Orders",
    icon: <FaJediOrder />,
    isSidebarActive: true,
  },
  {
    path: "/credit-notes",
    name: "Credit",
    isSidebarActive: true,
    icon: <AiTwotoneCreditCard />,
  },
  {
    path: "/settings",
    name: "Settings",
    icon: <MdOutlineSettings />,
    isSidebarActive: true,
    submenu: [
      {
        path: "/settings/profile",
        name: "Profile Settings",
        icon: <AiFillProfile />,
        isSidebarActive: true,
      },
    ],
  },
  {
    path: "/u/:id",
    name: "Profile",
    icon: <CgProfile />,
    isSidebarActive: true,
    element: <Profile/>
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
];

export default masterRoutes;
