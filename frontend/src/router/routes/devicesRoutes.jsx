import DevicesPage from "./pages/DevicesPage";
import DeviceDetailPage from "./pages/DeviceDetailPage";
import WarehousesPage from "./pages/WarehousesPage";
import { FaExclamationCircle } from "react-icons/fa";
export const deviceManagementRoutes = [
  {
    path: "/devices",
    name: "Devices",
    element: <DevicesPage />,
    isSidebarActive: false,
    icon: <FaExclamationCircle />,
  },
  {
    path: "/devices/:deviceId",
    element: <DeviceDetailPage />,
    isSidebarActive: false,
    icon: <FaExclamationCircle />,
  },
  {
    path: "/warehouses",
    element: <WarehousesPage />,
    isSidebarActive: false,
    icon: <FaExclamationCircle />,
  },
];
