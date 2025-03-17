import { useState } from "react";
import {
  FaCog,
  FaGlobe,
  FaMobileAlt,
  FaDesktop,
  FaDollarSign,
  FaTools,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const settingsMenu = [
  {
    title: "General Settings",
    icon: <FaCog size={18} />,
    subItems: [
      { name: "Profile", link: "/settings/general" },
      { name: "Security", link: "/settings/security" },
      { name: "Notifications", link: "/notification" },
      { name: "Connected Apps", link: "/connected-apps" },
    ],
  },
  {
    title: "Website Settings",
    icon: <FaGlobe size={18} />,
    subItems: [
      { name: "System Settings", link: "/system-settings" },
      { name: "Company Settings", link: "/company-settings" },
      { name: "Localization", link: "/localization-settings" },
      { name: "Prefixes", link: "/prefixes" },
      { name: "Preference", link: "/preference" },
      { name: "Appearance", link: "/appearance" },
      { name: "Social Authentication", link: "/social-authentication" },
      { name: "Language", link: "/language-settings" },
    ],
  },
  {
    title: "App Settings",
    icon: <FaMobileAlt size={18} />,
    subItems: [
      { name: "Invoice Settings", link: "/invoice-settings" },
      { name: "Invoice Templates", link: "/invoice-templates" },
      { name: "Printer", link: "/printer-settings" },
      { name: "POS", link: "/pos-settings" },
      { name: "Signatures", link: "/signatures" },
      { name: "Custom Fields", link: "/custom-fields" },
    ],
  },
  {
    title: "System Settings",
    icon: <FaDesktop size={18} />,
    subItems: [
      {
        name: "Email",
        subItems: [
          { name: "Email Settings", link: "/email-settings" },
          { name: "Email Templates", link: "/email-templates" },
        ],
      },
      {
        name: "SMS",
        subItems: [
          { name: "SMS Settings", link: "/sms-settings" },
          { name: "SMS Templates", link: "/sms-templates" },
        ],
      },
      { name: "OTP", link: "/otp-settings" },
      { name: "GDPR Cookies", link: "/gdpr-settings" },
    ],
  },
  {
    title: "Financial Settings",
    icon: <FaDollarSign size={18} />,
    subItems: [
      { name: "Payment Gateway", link: "/payment-gateway-settings" },
      { name: "Bank Accounts", link: "/bank-settings-grid" },
      { name: "Tax Rates", link: "/tax-rates" },
      { name: "Currencies", link: "/currency-settings" },
    ],
  },
  {
    title: "Other Settings",
    icon: <FaTools size={18} />,
    subItems: [
      { name: "Storage", link: "/storage-settings" },
      { name: "Ban IP Address", link: "/ban-ip-address" },
    ],
  },
];

const SettingsNav = () => {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  return (
    <ul>
      {settingsMenu.map((menu, index) => (
        <li
          key={index}
          className={`submenu ${openMenu === index ? "submenu-open" : ""}`}
        >
          <a href="#" onClick={() => toggleMenu(index)}>
            {menu.icon}
            <span className="ms-2">{menu.title}</span>
          </a>
          {menu.subItems && (
            <ul className={openMenu === index ? "open" : "closed"}>
              {menu.subItems.map((sub, subIndex) => (
                <li key={subIndex}>
                  {sub.subItems ? (
                    <>
                      <a
                        href="#"
                        onClick={() => toggleMenu(`${index}-${subIndex}`)}
                      >
                        {sub.name}
                      </a>
                      <ul
                        className={
                          openMenu === `${index}-${subIndex}`
                            ? "open"
                            : "closed"
                        }
                      >
                        {sub.subItems.map((deepSub, deepIndex) => (
                          <li key={deepIndex}>
                            <Link to={deepSub.link}>{deepSub.name}</Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <Link to={sub.link}>{sub.name}</Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
};

export default SettingsNav;
