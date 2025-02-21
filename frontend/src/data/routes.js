import Login from "../components/Auth/Login";
import Signup from "../components/Auth/Signup";
import Error404 from "../components/Error/Error404";
import PageWrapper from "../components/Home/PageWrapper";

const masterRoutes = [
  {
    path: "/",
    name: "Dashboard",
    icon: "fe fe-home",
    isSidebarActive: true,
    element: <PageWrapper/>,
    submenu: [],
  },
  {
    path: "/super-admin",
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
      { path: "/super-admin/orders" },
      { path: "/super-admin/invoices" },
      { path: "/super-admin/permissions" },
    ],
  },
  {
    path: "/users",
    name: "Customers",
    icon: "fe fe-user-graduate",
    isSidebarActive: true,
    submenu: [
      {
        path: "/users/list",
        name: "Student List",
        icon: "fe fe-list",
        isSidebarActive: true,
      },
      {
        path: "/users/id",
        name: "Attendance",
        icon: "fe fe-calendar-check",
        isSidebarActive: true,
      },
      {path: "/users/add"},
      {path: "/users/:id/edit"}
    ],
  },
  {
    path: "/inventory",
    name: "Inventory",
    icon: "fe fe-user-check",
    isSidebarActive: true,
    submenu: [
      {
        path: "/inventory/list",
        name: "Teacher List",
        icon: "fe fe-list",
        isSidebarActive: true,
      },
      {
        path: "/inventory/categories",
        name: "Schedule",
        icon: "fe fe-calendar",
        isSidebarActive: true,
      },
      { path: "/inventory/brands" },
      { path: "/inventory/vendors" },
      {path: "/inventory/product/add"},
      {path: "/inventory/product/:id"},
      {path: "/inventory/product/:id/edit"}
    ],
  },
  {
    path: "/signature",
    name: "Signature",
    icon: "fe fe-book-open",
    isSidebarActive: true,
    submenu: [
      {
        path: "/signature/list",
        name: "Course List",
        icon: "fe fe-list",
        isSidebarActive: true,
      },
      {
        path: "/signature/:id",
        name: "Categories",
        icon: "fe fe-grid",
        isSidebarActive: true,
      },
      {path: "/signature/:id/edit"},
      {path: "/signature/add"}

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
      {path: "/quotations/add"},
      {path: "/quotations/:id/edit"}
    ],
  },
  {
    path: "/orders",
    name: "Ordres",
    icon: "fe fe-book",
    isSidebarActive: true,

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
      {path: "/invoices/:id/edit",},
      {path: "/invocies/add"},
      {path: "/invoices/templates"}
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
    element: <Login/>
   
  },
  {
    path: "/signup",
    name: "Signup",
    icon: "fe fe-settings",
    isSidebarActive: true,
    element: <Signup/>
   
  },
  {
    path: "/404",
    name: "Error",
    icon: "fe fe-error",
    isSidebarActive: false,
    element: <Error404/>
  }

];

export default masterRoutes;
