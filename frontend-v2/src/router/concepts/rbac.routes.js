// src/routes/concepts/rbac.routes.js
import { Icons } from "../icons.config";

import UserList from "../../pages/User/UserList";
import NewAddUser from "../../pages/User/NewAddUser";
import UserPage from "../../pages/User/UserPage";
import RolePermission from "../../pages/RBAC/RolePermission";
import Permissions from "../../pages/RBAC/Permissions";

export const rbacRoutes = [
  {
    path: "/users/list",
    name: "Users",
    icon: Icons.user,
    element: <UserList />,
  },
  {
    path: "/user/add",
    name: "Create User",
    icon: Icons.user,
    element: <NewAddUser />,
  },
  {
    path: "/user/:userId",
    name: "User Details",
    icon: Icons.user,
    element: <UserPage />,
  },
  {
    path: "/user/:userId/edit",
    name: "Edit User",
    icon: Icons.user,
    element: <NewAddUser />,
  },
  {
    path: "/roles-permission/list",
    name: "Roles",
    icon: Icons.idCard,
    element: <RolePermission />,
  },
  {
    path: "/roles-permission/permissions/:id",
    name: "Grant Permissions",
    icon: Icons.user,
    element: <Permissions />,
    requiredPermission: { api: "view", module: "rolepermissions" }
  },
];