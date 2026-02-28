// src/routes/concepts/misc.routes.js
import { Icons } from "../icons.config";

import SearchPage from "../../components/Search/Search";
import Profile from "../../pages/Profile/Profile";
import ProfileForm from "../../pages/Profile/ProfileForm";
import NoAccess from "../../pages/Error/NoAccess";
import Error404 from "../../pages/Error/Error404";
import Error403 from "../../pages/Error/Error403";
import Error500 from "../../pages/Error/Error500";
import UnderMaintanance from "../../pages/Error/UnderMaintanance";
import ComingSoon from "../../pages/Error/ComingSoon";

import AddFieldGuidedSheet from "../../pages/FGS/AddFgs";
import FGSDetails from "../../pages/FGS/FGSDetails";

export const miscRoutes = [
  { path: "/search", name: "Search Results", icon: Icons.list, element: <SearchPage /> },

  { path: "/u/:id", name: "Profile", icon: Icons.userCircle, element: <Profile /> },
  { path: "/u/:id/edit", name: "Edit Profile", icon: Icons.userCircle, element: <ProfileForm /> },

  { path: "/no-access", name: "No Access", icon: Icons.userRemove, element: <NoAccess /> },

  { path: "/404", name: "Error 404", icon: Icons.error, element: <Error404 /> },
  { path: "/403", name: "Error 403", icon: Icons.error, element: <Error403 /> },
  { path: "/500", name: "Error 500", icon: Icons.error, element: <Error500 /> },

  { path: "/under-maintenance", name: "Under Maintenance", icon: Icons.error, element: <UnderMaintanance /> },
  { path: "/coming-soon", name: "Coming Soon", icon: Icons.error, element: <ComingSoon /> },

  // FGS
  { path: "/fgs/add", name: "Add FGS", icon: Icons.file, element: <AddFieldGuidedSheet /> },
  { path: "/fgs/:id", name: "FGS Details", icon: Icons.file, element: <FGSDetails /> },
  { path: "/fgs/:id/edit", name: "Edit FGS", icon: Icons.file, element: <AddFieldGuidedSheet /> },
];