// src/routes/userRoutes.js
import { FaUser, FaIdCard, FaUserCircle } from "react-icons/fa";
import NewAddUser from "../../concepts/User/NewAddUser";
import UserPage from "../../concepts/User/UserPage";
import Profile from "../../concepts/User/Profile";
import ProfileForm from "../../concepts/User/ProfileForm";
import Permissions from "../../concepts/RBAC/Permissions";

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
    requiredPermission: { api: "view", module: "rolepermissions" },
  },
  {
    path: "/u/:id",
    name: "Profile",
    icon: <FaUserCircle />,
    isSidebarActive: false,
    element: <Profile />,
  },
  {
    path: "/u/:id/edit",
    name: "Edit Profile",
    icon: <FaUserCircle />,
    isSidebarActive: false,
    element: <ProfileForm />,
  },
];