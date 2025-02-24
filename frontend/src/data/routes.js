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
const masterRoutes = [
  
  {
    path: "/",
    name: "Dashboard",
    icon: "fe fe-home",
    isSidebarActive: true,
    element: <PageWrapper />,
    submenu: [],
  },
  {
    path: "#",
    name: "Super Admin",
    icon: "fe fe-user-shield",
    isSidebarActive: true,
    submenu: [
      {
        path: "/super-admin/customers",
        name: "Users",
        icon: "fe fe-users",
        isSidebarActive: true,
      },
      {
        path: "/super-admin/signatures",
        name: "Roles",
        icon: "fe fe-lock",
        isSidebarActive: true,
      },
      { path: "/super-admin/orders", name: "Recent Orders", icon: "fe  fe-order", isSidebarActive: true },
      { path: "/super-admin/invoices", name: "Recent Invoices", icon: "fe fe-invoice", isSidebarActive: true },
      { path: "/super-admin/permissions", name: "Permission To Give", icon: "fe fe-permission", isSidebarActive: true },
    ],
  },
  {
    path: "#",
    name: "Misceleneos",
    icon: "fe fe-user-graduate",
    isSidebarActive: true,
    submenu: [
      {
        path: "/customers/list",
        name: "Student List",
        icon: "fe fe-list",
        isSidebarActive: true,
      },
      {
        path: "/vendors/list",
        name: "Attendance",
        icon: "fe fe-calendar-check",
        isSidebarActive: true,
      },
      { path: "/brands/list", name: "Brands", icon: "fe fe-brands", isSidebarActive: true },
    ],
  },
  {
    path: "/#",
    name: "Inventory",
    icon: "fe fe-user-check",
    isSidebarActive: true,
    submenu: [
      {
        path: "/inventory/list",
        name: "Inventory",
        icon: "fe fe-list",
        element: <ProductList/>,
        isSidebarActive: true,
      },

      {
        path: "/inventory/categories",
        element: <CategoriesList />,
        name: "Categories & Keywords",
        icon: "fe fe-calendar",
        isSidebarActive: true,
      },
      { path: "/inventory/product/add", name: "Products Add", icon: "fe fe-add", isSidebarActive: true },
      { path: "/inventory/product/:id", name: "Product Details", icon: "fe fe-details", isSidebarActive: true },
      { path: "/inventory/product/:id/edit", name: "Product Edit", icon: "fe fe-pen", isSidebarActive: true },
    ],
  },
  {
    path: "#",
    name: "Signature",
    icon: "fe fe-book-open",
    isSidebarActive: true,
    submenu: [
      {
        path: "/signature/list",
        name: "Signature",
        icon: "fe fe-list",
        isSidebarActive: true,
        element: <SignatureWrapper/>
      },
      {
        path: "/signature/:id",
        name: "Signature Details",
        icon: "fe fe-grid",
        isSidebarActive: true,
      },
      { path: "/signature/:id/edit", name:"Signature Edit", icon: "fe fe-pen", isSidebarActive: true },
      { path: "/signature/add", name: "Signature Add", icon: "fe fe-add", isSidebarActive: true },
    ],
  },
  {
    path: "/quotations",
    name: "Quotations",
    icon: "fe fe-file-text",
    isSidebarActive: true,
    submenu: [
      {
        path: "/quotations/list",
        name: "Exam Schedule",
        icon: "fe fe-calendar",
        isSidebarActive: true,
      },
      {
        path: "/quotations/:id",
        name: "Results",
        icon: "fe fe-check-square",
        isSidebarActive: true,
      },
      { path: "/quotations/add" },
      { path: "/quotations/:id/edit" },
    ],
  },
  {
    path: "/orders",
    name: "Ordres",
    icon: "fe fe-book",
    isSidebarActive: true,
  },
  {
    path: "/credit-notes", name: "Credit", isSidebarActive: true
  },
  {
    path: "/invoices",
    name: "Settings",
    icon: "fe fe-settings",
    isSidebarActive: true,
    submenu: [
      {
        path: "/invoices/list",
        name: "Profile Settings",
        icon: "fe fe-user",
        isSidebarActive: true,
      },
      {
        path: "/invoices/:id",
        name: "System Settings",
        icon: "fe fe-sliders",
        isSidebarActive: true,
      },
      { path: "/invoices/:id/edit" },
      { path: "/invocies/add" },
      { path: "/invoices/templates" },
    ],
  },
  {
    path: "/settings",
    name: "Settings",
    icon: "fe fe-settings",
    isSidebarActive: true,
    submenu: [
      {
        path: "/settings/profile",
        name: "Profile Settings",
        icon: "fe fe-user",
        isSidebarActive: true,
      },
      {
        path: "/settings/system",
        name: "System Settings",
        icon: "fe fe-sliders",
        isSidebarActive: true,
      },
    ],
  },
  {
    path: "/u",
    name: "Profile",
    icon: "fe fe-settings",
    isSidebarActive: true,
    submenu: [
      {
        path: "/u/:id",
        name: "Profile Settings",
        icon: "fe fe-user",
        isSidebarActive: true,
      },
      {
        path: "/#",
        name: "Logout",
        icon: "fe fe-sliders",
        isSidebarActive: true,
      },
    ],
  },
  {
    path: "/u",
    name: "Profile",
    icon: "fe fe-settings",
    isSidebarActive: true,
    submenu: [
      {
        path: "/u/:id",
        name: "Profile Settings",
        icon: "fe fe-user",
        isSidebarActive: true,
      },
      {
        path: "/#",
        name: "Logout",
        icon: "fe fe-sliders",
        isSidebarActive: true,
      },
    ],
  },
  {
    path: "/login",
    name: "login",
    icon: "fe fe-settings",
    isSidebarActive: true,
    element: <Login />,
  },
  {
    path: "/signup",
    name: "Signup",
    icon: "fe fe-settings",
    isSidebarActive: true,
    element: <Signup />,
  },
  {
    path: "/404",
    name: "Error",
    icon: "fe fe-error",
    isSidebarActive: true,
    element: <Error404 />,
  },
  {
    path: "/forgot-password",
    name: "Forgot Password",
    icon: "fe fe-error",
    isSidebarActive: true,
    element: <ForgotPassword />,
  },
  {
    path: "/vendors",
    name: "Vendors",
    icon: "fe fe-master",
    isSidebarActive: true,
    element: <ComapniesWrapper />,
  },
  {
    path: "/products/list",
    name: "POS",
    icon: "fe fe-list",
    isSidebarActive: true,
    element: <ProductList />,
  },
  {
    path: "/inventory/list",
    name: "Inventory ",
    icon: "fe fe-list",

    isSidebarActive: true,
    element: <InventoryWrapper />,
  },
  {
    path: "/category/list",
    name: "Categories",
    isSidebarActive: true,
    icon: "fe fe-list",
    element: <CategoriesList />,
  },
  {
    path: "/customers/list",
    name: "Customers",
    isSidebarActive: true,
    icon: "fe fe-list",
    element: <CustomerList />,
  },
  {
    path: "/customer/:id",
    name: "Customer Details",
    isSidebarActive: true,
    icon: "fe fe-list",
    element: <CustomerDetails />,
  },
  {
    path: "/customer/:id/ledger",
    name: "Customer Ledger",
    isSidebarActive: true,
    icon: "fe fe-list",
    element: <CustomerLedger />,
  },
];

export default masterRoutes;
