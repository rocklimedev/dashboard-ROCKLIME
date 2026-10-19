import { lazy } from "react";
import { Navigate } from "react-router-dom";
// src/routes/othersRoutes.js
import { FaListUl, FaShoppingCart, FaBell } from "react-icons/fa";
import { FaCog } from "react-icons/fa";
const SearchPage = lazy(() => import("../../concepts/Search/Search"));
const AddFieldgeneratedSheet = lazy(() => import("../../concepts/PO/AddFgs"));
const FGSDetails = lazy(() => import("../../concepts/PO/FGSDetails"));
const JobList = lazy(() => import("../../concepts/Jobs/JobsList"));
const JobDetails = lazy(() => import("../../concepts/Jobs/JobDetails"));
const NewQuotation = lazy(() => import("../../concepts/Cart/NewQuotation"));
const NewOrder = lazy(() => import("../../concepts/Cart/NewOrder"));
const NewPurchaseOrder = lazy(() => import("../../concepts/Cart/NewPurchaseOrder"));
const AppsHome = lazy(() => import("../../apps/AppsHome"));
const CompanySettings = lazy(() => import("../../concepts/Settings/CompanySettings"));
const AccountsPage = lazy(() => import("../../concepts/Accounts/AccountsPage"));

export const otherRoutes = [
  { path: "/apps", name: "Apps", isSidebarActive: false, element: <AppsHome /> },
  { path: "/settings/company", name: "Company & documents", isSidebarActive: false, element: <CompanySettings /> },
  { path: "/accounts", name: "Accounts", isSidebarActive: false, element: <AccountsPage /> },
  {
    path: "/cart/quotation",
    name: "Cart",
    icon: <FaShoppingCart />,
    isSidebarActive: false,
    element: <NewQuotation />,
  },
  {
    path: "/cart/order",
    name: "Cart",
    icon: <FaShoppingCart />,
    isSidebarActive: false,
    element: <NewOrder />,
  },
  {
    path: "/cart/purchase-order",
    name: "Cart",
    icon: <FaShoppingCart />,
    isSidebarActive: false,
    element: <NewPurchaseOrder />,
  },
  {
    path: "/search",
    name: "Search Results",
    icon: <FaListUl />,
    isSidebarActive: false,
    element: <SearchPage />,
  },
  {
    path: "/fgs/add",
    name: "Add FGS",
    element: <AddFieldgeneratedSheet />,
    isSidebarActive: false,
  },
  {
    path: "/fgs/:id",
    name: "FGS Details",
    element: <FGSDetails />,
    isSidebarActive: false,
  },
  {
    path: "/fgs/:id/edit",
    name: "Edit FGS",
    element: <AddFieldgeneratedSheet />,
    isSidebarActive: false,
  },
  {
    path: "/jobs/list",
    name: "Jobs",
    element: <JobList />,
    icon: <FaBell />,
    isSidebarActive: false,
  },
  {
    path: "/job/:jobId",
    name: "Job Details",
    element: <JobDetails />,
    isSidebarActive: false,
  },
  {
    path: "/settings",
    name: "Settings",
    icon: <FaCog />,
    isSidebarActive: false,
    element: <Navigate to="/settings/company" replace />,
  },
];
