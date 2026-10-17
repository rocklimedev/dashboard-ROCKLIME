import { lazy } from "react";
// src/routes/authRoutes.js
import { FaSignInAlt, FaExclamationCircle } from "react-icons/fa";
const AccountVerify = lazy(() => import("../../concepts/Auth/AccountVerify"));
const Login = lazy(() => import("../../concepts/Auth/Login"));
const Signup = lazy(() => import("../../concepts/Auth/Signup"));
const ForgotPassword = lazy(() => import("../../concepts/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../../concepts/Auth/ResetPassword"));
const EmailVerification = lazy(() => import("../../concepts/Auth/EmailVerifications"));
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
    path: "/verify-account/:token",
    name: "Verify Account",
    element: <AccountVerify />,
  },
  {
    path: "/account-verify",
    name: "Account Verify",
    element: <AccountVerify />,
    isSidebarActive: false,
  },
];
