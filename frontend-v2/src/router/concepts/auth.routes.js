// src/routes/concepts/auth.routes.js
import { Icons } from "../icons.config";

import Login from "../../pages/Auth/Login";
import Signup from "../../pages/Auth/Signup";
import ForgotPassword from "../../pages/Auth/ForgotPassword";
import ResetPassword from "../../pages/Auth/ResetPassword";
import EmailVerification from "../../pages/Auth/EmailVerifications";

export const authRoutes = [
  { path: "/login", element: <Login />, name: "Login", icon: Icons.login },
  { path: "/signup", element: <Signup />, name: "Signup", icon: Icons.login },
  { path: "/forgot-password", element: <ForgotPassword />, name: "Forgot Password", icon: Icons.error },
  { path: "/reset-password/:token", element: <ResetPassword />, name: "Reset Password", icon: Icons.error },
  { path: "/verify-account", element: <EmailVerification />, name: "Verify Account", icon: Icons.login },
];