import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SettingsNav from "./SettingsNav";
import { FcSettings } from "react-icons/fc";
import { GiWorld } from "react-icons/gi";
import { MdDevices, MdMiscellaneousServices } from "react-icons/md";
import ProfileSettings from "./ProfileSettings";
import SecuritySettings from "./SecuritySettings";

import "./settingsWrapper.css";

// Define menu items
const menuItems = [
  {
    title: "General Settings",
    icon: <FcSettings />,
    submenu: [
      { name: "Profile", path: "/settings/profile" },
      { name: "Security", path: "/settings/security" },
      { name: "Notifications", path: "/settings/notifications" },
      { name: "Connected Apps", path: "/settings/connected-apps" },
    ],
  },
  {
    title: "Website Settings",
    icon: <GiWorld />,
    submenu: [
      { name: "System Settings", path: "/settings/system" },
      { name: "Company Settings", path: "/settings/company" },
      { name: "Localization", path: "/settings/localization" },
      { name: "Prefixes", path: "/settings/prefixes" },
      { name: "Appearance", path: "/settings/appearance" },
    ],
  },
  {
    title: "App Settings",
    icon: <MdDevices />,
    submenu: [
      { name: "Invoice Settings", path: "/settings/invoice" },
      { name: "POS", path: "/settings/pos" },
      { name: "Signatures", path: "/settings/signatures" },
    ],
  },
  {
    title: "Other Settings",
    icon: <MdMiscellaneousServices />,
    submenu: [
      { name: "Integrations", path: "/settings/integrations" },
      { name: "API Keys", path: "/settings/api-keys" },
      { name: "Billing", path: "/settings/billing" },
    ],
  },
];

const GeneralSettings = () => {
  return (
    <div className="page-wrapper">
      <div className="content settings-content">
        <div className="page-header">
          <h4 className="fw-bold">Settings</h4>
          <h6>Manage your settings on the portal</h6>
        </div>
        <div className="settings-wrapper d-flex">
          <aside className="settings-sidebar">
            <div className="sidebar-inner slimscroll">
              <div id="sidebar-menu5" className="sidebar-menu">
                <h4 className="fw-bold fs-18 mb-2 pb-2">Settings</h4>
                <SettingsNav menuItems={menuItems} />
              </div>
            </div>
          </aside>
          <main className="settings-main">
            <Routes>
              {/* Default route */}
              <Route
                path="/settings"
                element={<Navigate to="/settings/profile" replace />}
              />

              {/* General Settings */}
              <Route path="/settings/profile" element={<ProfileSettings />} />
              <Route path="/settings/security" element={<SecuritySettings />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
