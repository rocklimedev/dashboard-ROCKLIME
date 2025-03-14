import React from "react";
import { Outlet } from "react-router-dom";
import SettingsNav from "./SettingsNav";
import Router from "../../router/Router";
import { FcSettings } from "react-icons/fc";
import { GiWorld } from "react-icons/gi";
import { MdDevices, MdMiscellaneousServices } from "react-icons/md";
import ProfileSettings from "./ProfileSettings";

// Define menu items dynamically
const menuItems = [
  {
    title: "General Settings",
    icon: <FcSettings />,
    subItems: [
      { label: "Profile", link: "/settings/general" },
      { label: "Security", link: "/settings/security" },
      { label: "Notifications", link: "/settings/notifications" },
      { label: "Connected Apps", link: "/settings/connected-apps" },
    ],
  },
  {
    title: "Website Settings",
    icon: <GiWorld />,
    subItems: [
      { label: "System Settings", link: "/settings/system" },
      { label: "Company Settings", link: "/settings/company" },
      { label: "Localization", link: "/settings/localization" },
      { label: "Prefixes", link: "/settings/prefixes" },
      { label: "Appearance", link: "/settings/appearance" },
    ],
  },
  {
    title: "App Settings",
    icon: <MdDevices />,
    subItems: [
      { label: "Invoice Settings", link: "/settings/invoice" },
      { label: "POS", link: "/settings/pos" },
      { label: "Signatures", link: "/settings/signatures" },
    ],
  },
  {
    title: "Other Settings",
    icon: <MdMiscellaneousServices />,
    subItems: [
      { label: "Integrations", link: "/settings/integrations" },
      { label: "API Keys", link: "/settings/api-keys" },
      { label: "Billing", link: "/settings/billing" },
    ],
  },
];

const GeneralSettings = () => {
  return (
    <div className="page-wrapper">
      <div className="content settings-content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4 className="fw-bold">Settings</h4>
              <h6>Manage your settings on the portal</h6>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-xl-12">
            <div className="settings-wrapper d-flex">
              <div className="settings-sidebar" id="sidebar2">
                <div className="sidebar-inner slimscroll">
                  <div id="sidebar-menu5" className="sidebar-menu">
                    <h4 className="fw-bold fs-18 mb-2 pb-2">Settings</h4>
                    <SettingsNav menuItems={menuItems} />
                  </div>
                </div>
              </div>
              <ProfileSettings />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
