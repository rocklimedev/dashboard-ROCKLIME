// src/routes/errorRoutes.js
import { FaExclamationCircle } from "react-icons/fa";
import NoAccess from "../../concepts/Error/NoAccess";
export const errorRoutes = [
  {
    path: "/no-access",
    name: "No Access",
    icon: <FaExclamationCircle />,
    isSidebarActive: false,
    element: <NoAccess />,
  },

];