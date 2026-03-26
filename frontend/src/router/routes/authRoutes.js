// src/routes/authRoutes.js
import { FaSignInAlt, FaExclamationCircle } from "react-icons/fa";
import AccountVerify from "../../concepts/Auth/AccountVerify";
import Login from "../../concepts/Auth/Login";
import Signup from "../../concepts/Auth/Signup";
import ForgotPassword from "../../concepts/Auth/ForgotPassword";
import ResetPassword from "../../concepts/Auth/ResetPassword";
import EmailVerification from "../../concepts/Auth/EmailVerifications";
export const authRoutes = [
  {
    path: "/login",
    name: "Login",
    icon: <FaSignInAlt />,
    isSidebarActive: false,
    element: <Login />,
  },
  {
    path: "/signup",
    name: "Signup",
    icon: <FaSignInAlt />,
    isSidebarActive: false,
    element: <Signup />,
  },
  {
    path: "/forgot-password",
    name: "Forgot Password",
    icon: <FaExclamationCircle />,
    isSidebarActive: false,
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password/:token",
    name: "Reset Password",
    icon: <FaExclamationCircle />,
    isSidebarActive: false,
    element: <ResetPassword />,
  },
  {
    path: "/verify-account",
    name: "Verify Account",
    icon: <FaSignInAlt />,
    isSidebarActive: false,
    element: <EmailVerification />,
  },
  {
    path: "/account-verify",
    name: "Account Verify",
    element: <AccountVerify />,
    isSidebarActive: false,
  },
];