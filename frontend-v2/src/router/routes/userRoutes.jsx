import { lazy } from "react";
// src/routes/userRoutes.js
import { FaUser, FaIdCard, FaUserCircle } from "react-icons/fa";
import PersonalRoute from "../PersonalRoute";
const NewAddUser = lazy(() => import("../../concepts/User/NewAddUser"));
const UserPage = lazy(() => import("../../concepts/User/UserPage"));
const Profile = lazy(() => import("../../concepts/User/Profile"));
const Permissions = lazy(() => import("../../concepts/RBAC/Permissions"));
const GeneralSettings = lazy(() => import("../../concepts/Settings/GeneralSettings"));

export const userRoutes = [
  {
    path: "/u/:id/settings",
    name: "My Account Settings",
    isSidebarActive: false,
    element: <PersonalRoute><GeneralSettings /></PersonalRoute>,
  },
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
    element: <PersonalRoute><Profile /></PersonalRoute>,
  },
];
