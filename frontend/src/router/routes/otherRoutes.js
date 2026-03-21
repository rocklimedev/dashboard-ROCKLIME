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
export const otherRoutes = [
  {
    path: "/cart",
    name: "Cart",
    icon: <FaShoppingCart />,
    isSidebarActive: false,
    element: <NewCart />,
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
    element: <AddFieldGuidedSheet />,
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