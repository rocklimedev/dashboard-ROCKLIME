// src/routes/othersRoutes.js
import { FaListUl, FaShoppingCart, FaBell } from "react-icons/fa";
import { FaCog } from "react-icons/fa";
import NewCart from "../../concepts/Cart/NewCart";
import SearchPage from "../../concepts/Search/Search";
import AddFieldgeneratedSheet from "../../concepts/PO/AddFgs";
import FGSDetails from "../../concepts/PO/FGSDetails";
import JobList from "../../concepts/Jobs/JobsList";
import JobDetails from "../../concepts/Jobs/JobDetails";
import GeneralSettings from "../../concepts/Settings/GeneralSettings";
import NewQuotation from "../../concepts/Cart/NewQuotation";
import NewOrder from "../../concepts/Cart/NewOrder";
import NewPurchaseOrder from "../../concepts/Cart/NewPurchaseOrder";
export const otherRoutes = [
  {
    path: "/cart",
    name: "Cart",
    icon: <FaShoppingCart />,
    isSidebarActive: false,
    element: <NewCart />,
  },
  {
    path: "/quotations/new",
    name: "Cart",
    icon: <FaShoppingCart />,
    isSidebarActive: false,
    element: <NewQuotation />,
  },
  {
    path: "/orders/new",
    name: "Cart",
    icon: <FaShoppingCart />,
    isSidebarActive: false,
    element: <NewOrder />,
  },
  {
    path: "/purchase-orders/new",
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
    element: <GeneralSettings />,
  },
];
