import { lazy } from "react";
// src/routes/userRoutes.js
import { FaUser, FaIdCard, FaUserCircle } from "react-icons/fa";
const NewAddUser = lazy(() => import("../../concepts/User/NewAddUser"));
const UserPage = lazy(() => import("../../concepts/User/UserPage"));
const Profile = lazy(() => import("../../concepts/User/Profile"));
const Permissions = lazy(() => import("../../concepts/RBAC/Permissions"));

export const userRoutes = [
  {
    path: "/user/add",
    name: "Create User",
    icon: <FaUser />,
    isSidebarActive: false,
    element: <NewAddUser />,
  },
  {
    path: "/user/:userId",
    name: "User Details",
    icon: <FaUser />,
    isSidebarActive: false,
    element: <UserPage />,
  },
  {
    path: "/user/:userId/edit",
    name: "Edit User",
    icon: <FaUser />,
    isSidebarActive: false,
    element: <NewAddUser />,
  },
  {
    path: "/roles-permission/permissions/:id",
    name: "Grant Permissions",
    icon: <FaUser />,
    isSidebarActive: false,
    element: <Permissions />,
  },
  {
    path: "/u/:id",
    name: "Profile",
    icon: <FaUserCircle />,
    isSidebarActive: false,
    element: <Profile />,
  },
];
