// src/routes/errorRoutes.js
import { FaExclamationCircle } from "react-icons/fa";
import NoAccess from "../../concepts/Error/NoAccess";
import Error404 from "../../concepts/Error/Error404";
export const errorRoutes = [
  {
    path: "/no-access",
    name: "No Access",
    icon: <FaExclamationCircle />,
    isSidebarActive: false,
    element: <NoAccess />,
  },
  {
    path: "/404",
    name: "Error 404",
    icon: <FaExclamationCircle />,
    element: <Error404 />,
  },
];
