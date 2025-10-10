import { BiCoinStack } from "react-icons/bi";
import Error500 from "../components/Error/Error500";
import { IoDocumentAttach, IoLogIn } from "react-icons/io5";
import {
  MdOutlineBrandingWatermark,
  MdError,
  MdOutlineSettings,
} from "react-icons/md";
import {
  MdOutlineInventory2,
  MdOutlineDiscount,
  MdOutlinePeopleAlt,
} from "react-icons/md";
import { BiAccessibility, BiCart, BiCategory, BiUser } from "react-icons/bi";
import NoAccess from "../components/Common/NoAccess";
import { RiDashboardLine, RiListOrdered } from "react-icons/ri";
import { CgProfile } from "react-icons/cg";
import ForgotPassword from "../components/Auth/ForgotPassword";
import { FaFileCircleCheck } from "react-icons/fa6";
import Login from "../components/Auth/Login";
import Signup from "../components/Auth/Signup";
import Error404 from "../components/Error/Error404";
import { RiFileListLine } from "react-icons/ri";
import ComingSoon from "../components/Error/ComingSoon";
import PageWrapper from "../components/Home/PageWrapper";
import UnderMaintanance from "../components/Error/UnderMaintanance";
import ContactWrapper from "../components/Contact/ContactWrapper";
import EmailVerification from "../components/Auth/EmailVerifications";
import EmailInterface from "../components/Contact/EmailInterface";
import ResetPassword from "../components/Auth/ResetPassword";
import Profile from "../components/Profile/Profile";
import AttendanceWrapper from "../components/Attendance/AttendanceList";
import AttendanceList from "../components/Attendance/AttendanceList";
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
    path: "/hrm/list",
    name: "HRM",
    icon: <MdOutlinePeopleAlt />,
    isSidebarActive: true,
    element: <AttendanceList />,
  },
  {
    path: "/u/:id/attendance",
    name: "HRMS",
    icon: <MdOutlinePeopleAlt />,
    isSidebarActive: false,
    element: <AttendanceWrapper />,
  },
  {
    path: "/email",
    name: "Email",
    icon: <RiFileListLine />,
    element: <EmailInterface />,
    isSidebarActive: true,
  },

  {
    path: "/contact",
    element: <ContactWrapper />,
    name: "Contact",
    icon: <BiCoinStack />,
    isSidebarActive: true,
  },
  {
    path: "#",
    name: "Others",
    icon: <FaFileCircleCheck />,
    isSidebarActive: false,
    submenu: [
      {
        path: "/u/:id",
        name: "Profile",
        icon: <CgProfile />,
        isSidebarActive: false,
        element: <Profile />,
      },
      {
        path: "/verify-account",
        name: "Veriy Account",
        icon: <IoLogIn />,
        isSidebarActive: false,
        element: <EmailVerification />,
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
        path: "/reset-password/:token",
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
